export const HEIGHTS = ['5 ft 0–1 in (about 152–155 cm)', '5 ft 2–3 in (about 157–160 cm)', '5 ft 4–5 in (about 163–165 cm)', '5 ft 6–7 in (about 168–170 cm)', '5 ft 8–9 in (about 173–175 cm)', '5 ft 10 in or taller (about 178 cm+)'];
export const SIZES = [52,54,56,58,60].map((size,index) => ({size,centimetres:(size*2.54).toFixed(1),height:HEIGHTS[index]}));
export function suggestSize(height,fit='regular') {
  if (!/^[0-5]$/.test(String(height)) || !['regular','loose','heels'].includes(fit)) return {error:'Please select your height and fit preference.'};
  const h=Number(height);
  if (h===5 || (h===4 && fit==='heels')) return {size:null,needsCustom:true,height:HEIGHTS[h],message:'Please send your shoulder-to-hem measurement with your intended footwear. Extra length or custom sizing may be needed; our chart stops at size 60.'};
  const index=h+(fit==='heels'?1:0);
  const message=fit==='loose'?'Start with this length size and ask for a wider cut at the bust and hips. A loose fit depends on garment width.':fit==='heels'?'A starting length one size above the height guide. Measure with your intended heels and confirm the hem position before ordering.':'A starting point based on your height band. Confirm your shoulder-to-hem measurement and the chosen design’s width before ordering.';
  return {size:SIZES[index].size,needsCustom:false,height:HEIGHTS[h],message};
}
if(typeof document!=='undefined' && document.querySelector('#size-finder')) {
  // Plain text isolates keep numeric ranges in order inside native select options.
  const ltrRange = (range) => '\u2066' + range + '\u2069';
  const arabicHeights = ['5 قدم و0–1 بوصة (152 إلى 155 سم تقريبًا)', '5 قدم و2–3 بوصة (157 إلى 160 سم تقريبًا)', '5 قدم و4–5 بوصة (163 إلى 165 سم تقريبًا)', '5 قدم و6–7 بوصة (168 إلى 170 سم تقريبًا)', '5 قدم و8–9 بوصة (173 إلى 175 سم تقريبًا)', '5 قدم و10 بوصات أو أكثر (178 سم تقريبًا أو أكثر)'];
  const heightLabels = localText(HEIGHTS, arabicHeights.map(label => label.replace(/\d+–\d+/g, ltrRange)));
  const form=document.querySelector('#size-finder'), result=document.querySelector('#size-result'), rows=document.querySelector('#size-chart');
  const style=new URLSearchParams(window.location.search).get('style')?.slice(0,150) || '';
  if(style){document.querySelector('#guide-product').hidden=false;document.querySelector('#guide-product').textContent=localText('Choosing a size for: ', 'اختيار مقاس التصميم: ')+style;}
  for(const item of SIZES){const row=document.createElement('tr');row.dataset.size=String(item.size);for(const value of [String(item.size),item.size+localText(' in',' بوصة'),item.centimetres+localText(' cm',' سم'),heightLabels[HEIGHTS.indexOf(item.height)]]){const cell=document.createElement(row.children.length===0?'th':'td');if(row.children.length===0)cell.scope='row';cell.textContent=value;row.appendChild(cell);}rows.appendChild(row);}
  if (isArabic) {
    document.querySelectorAll('#guide-height option[value]:not([value=""])').forEach(option => {
      option.textContent = heightLabels[Number(option.value)];
    });
  }
  const makeLink=(details='')=>'https://wa.me/971502002394?text='+encodeURIComponent(localText(
    'Hello AL MUSHREF, I need help choosing my abaya size.'+(style?' Design: '+style+'.':'')+(details?' '+details:' Please help me confirm the garment length and width.'),
    'مرحبًا المشرف للخياطة والتطريز، أحتاج إلى مساعدة في اختيار مقاس العباية.'+(style?' التصميم: '+style+'.':'')+(details?' '+details:' يرجى مساعدتي في تأكيد طول العباية وعرضها.')));
  document.querySelector('#guide-whatsapp').href=makeLink();
  form.addEventListener('submit',event=>{
    event.preventDefault();const height=document.querySelector('#guide-height'),fit=document.querySelector('#guide-fit'),suggestion=suggestSize(height.value,fit.value),error=document.querySelector('#size-error');
    if(suggestion.error){error.hidden=false;error.textContent=t(suggestion.error);height.setAttribute('aria-invalid','true');height.focus();return;}
    error.hidden=true;height.removeAttribute('aria-invalid');result.hidden=false;
    document.querySelector('#size-result-label').textContent=t(suggestion.needsCustom?'Let’s check your length':'Suggested length size');
    document.querySelector('#suggested-size').textContent=suggestion.size===null?t('Custom check'):String(suggestion.size);
    document.querySelector('#size-measurement').textContent=suggestion.size===null?t('Confirm your measurements with our team'):suggestion.size+localText(' in · ',' بوصة · ')+(suggestion.size*2.54).toFixed(1)+localText(' cm nominal length',' سم (الطول الاسمي)');
    document.querySelector('#size-result-note').textContent=t(suggestion.message);
    for(const row of rows.children)row.classList.toggle('size-highlight',Number(row.dataset.size)===suggestion.size);
    const detailsEnglish='Height band: '+suggestion.height+'. Preference: '+fit.options[fit.selectedIndex].text+'. '+(suggestion.size===null?'Please check whether I need custom length.':'The size guide suggests length size '+suggestion.size+'. Please confirm the fit.');
    const detailsArabic = 'نطاق طولي: '+heightLabels[Number(height.value)]+'. التفضيل: '+fit.options[fit.selectedIndex].text+'. '+(suggestion.size===null?'يرجى التأكد مما إذا كنت أحتاج إلى طول خاص.':'الطول المقترح في الدليل هو مقاس '+suggestion.size+'. يرجى تأكيد المقاس المناسب.');
    const details = localText(detailsEnglish, detailsArabic);
    document.querySelector('#size-result-whatsapp').href=makeLink(details);document.querySelector('#guide-whatsapp').href=makeLink(details);
  });
  form.addEventListener('change',()=>{result.hidden=true;document.querySelector('#size-error').hidden=true;document.querySelector('#guide-height').removeAttribute('aria-invalid');for(const row of rows.children)row.classList.remove('size-highlight');});
  document.querySelector('#print-guide').addEventListener('click',()=>window.print());
  const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
  nav.addEventListener('click',event=>{if(event.target.closest('a')){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}});
}
