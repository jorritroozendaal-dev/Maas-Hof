import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../intranet.mjs',import.meta.url),'utf8').replace(/^import[^\n]*\n/,'');
class Element{
  constructor(){this.hidden=false;this.value='';this.listeners={};this.attrs={};this.children=[];}
  addEventListener(t,fn){this.listeners[t]=fn} reportValidity(){return true}
  setAttribute(k,v){this.attrs[k]=v} removeAttribute(k){delete this.attrs[k]}
  replaceChildren(...children){this.children=children} focus(){this.focused=true}
}
function load(decrypt){
  const ids=['intranet-login','intranet-password','intranet-error','intranet-private','intranet-content','intranet-lock'];
  const elements=Object.fromEntries(ids.map(id=>['#'+id,new Element()]));
  const submit=new Element();elements['#intranet-login'].querySelector=()=>submit;
  elements['#intranet-private'].hidden=true;
  const events={};let timer;
  const document={querySelector:s=>elements[s],createElement:()=>new Element()};
  // Only the module URL needs adapting for the VM; no production logic changes.
  const code=source.replace('import.meta.url',"'https://example.test/intranet.mjs'");
  vm.runInNewContext(code,{document,decryptIntranet:decrypt,fetch:async()=>({ok:true,json:async()=>({})}),URL,window:{addEventListener:(type,fn)=>events[type]=fn},setTimeout:fn=>(timer=fn,1),clearTimeout(){}});
  return {elements,submit,events,timeout:()=>timer()};
}
test('login fails closed, successful decryption clears password, and lock removes readable content',async()=>{
  const app=load(async(_p,password)=>{if(password!=='fixture-only')throw new Error();return {title:'Private fixture',intro:'Internal text',sections:[]}});
  const form=app.elements['#intranet-login'],input=app.elements['#intranet-password'],panel=app.elements['#intranet-private'],content=app.elements['#intranet-content'];
  input.value='wrong';await form.listeners.submit({preventDefault(){}});
  assert.equal(panel.hidden,true);assert.equal(content.children.length,0);assert.equal(input.value,'');
  input.value='fixture-only';await form.listeners.submit({preventDefault(){}});
  assert.equal(panel.hidden,false);assert.equal(form.hidden,true);assert.equal(input.value,'');assert.equal(content.children[0].textContent,'Private fixture');
  app.timeout();assert.equal(panel.hidden,true);assert.equal(content.children.length,0);assert.equal(form.hidden,false);
});
test('navigation away cancels a pending unlock and cannot restore decrypted content on back navigation',async()=>{
  let resolve,start;
  const started=new Promise(r=>start=r);
  const app=load(()=>{start();return new Promise(r=>resolve=r)});
  const form=app.elements['#intranet-login'];app.elements['#intranet-password'].value='fixture-only';
  const pending=form.listeners.submit({preventDefault(){}});await started;
  app.events.pagehide();resolve({title:'Late content',intro:'Should not appear',sections:[]});await pending;
  app.events.pageshow({persisted:true});
  assert.equal(app.elements['#intranet-private'].hidden,true);assert.equal(app.elements['#intranet-content'].children.length,0);assert.equal(app.submit.disabled,false);
});
