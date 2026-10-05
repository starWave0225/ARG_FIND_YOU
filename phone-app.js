(() => {
  let api, active=null, position=0;
  const $=id=>document.getElementById(id);
  const normalize=value=>String(value).normalize('NFKC').replace(/[\s-]/g,'');
  function history(){
    $('phoneHistory').replaceChildren();
    for(const call of (api.getState().phoneHistory||[]).slice().reverse()){
      const row=document.createElement('p'); row.textContent=`${call.number} · ${call.result}`; $('phoneHistory').append(row);
    }
  }
  function record(result){
    api.save({phoneHistory:[...(api.getState().phoneHistory||[]),{number:$('phoneNumber').value,result,at:new Date().toISOString()}].slice(-50)});history();
  }
  function finish(completed){
    const contact=active; active=null; $('phoneConversation').hidden=true;
    $('phoneHangup').disabled=true; $('phoneDial').disabled=false; $('phoneNumber').disabled=false;
    document.querySelectorAll('[data-phone-key],#phoneErase').forEach(button=>button.disabled=false);
    $('phoneStatus').textContent='通话结束';
    record(completed?'通话完成':'已挂断');
    if(completed&&contact.identityConfirmed) api.confirm(contact);
  }
  function line(){
    const current=active.lines[position];
    $('phoneSpeaker').textContent=current.speaker; $('phoneLine').textContent=current.text;
    $('phoneContinue').textContent=current.response||'回应';
  }
  window.PhoneApp={init(callbacks){
    api=callbacks; history();
    $('phoneDialForm').addEventListener('submit',event=>{
      event.preventDefault(); if(active)return;
      const number=normalize($('phoneNumber').value); $('phoneNumber').value=number;
      const contact=(window.PhoneContacts||[]).find(item=>item.number===number&&/^\d{10}$/.test(item.number)&&item.lines?.length);
      if(!/^\d{10}$/.test(number)||!contact){$('phoneStatus').textContent='无法接通';record('未接通');return;}
      active=contact;position=0;$('phoneStatus').textContent='通话中';$('phoneConversation').hidden=false;
      $('phoneHangup').disabled=false;$('phoneDial').disabled=true;$('phoneNumber').disabled=true;
      document.querySelectorAll('[data-phone-key],#phoneErase').forEach(button=>button.disabled=true);line();
    });
    document.querySelectorAll('[data-phone-key]').forEach(button=>button.addEventListener('click',()=>{if(!active&&$('phoneNumber').value.length<10)$('phoneNumber').value+=button.dataset.phoneKey;}));
    $('phoneErase').addEventListener('click',()=>{if(!active)$('phoneNumber').value=$('phoneNumber').value.slice(0,-1);});
    $('phoneHangup').addEventListener('click',()=>{if(active)finish(false);});
    $('phoneContinue').addEventListener('click',()=>{if(!active)return;if(++position>=active.lines.length)finish(true);else line();});
    document.addEventListener('arg-state-changed',history);
  }};
})();
