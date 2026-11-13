import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const code = fs.readFileSync(new URL('app.js', root), 'utf8');
class Element {
  constructor() { this.listeners={}; this.attrs={}; this.value=''; this.hidden=true; this.disabled=true; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  async fire(type, extra={}) { for (const fn of this.listeners[type] ?? []) await fn({preventDefault(){},currentTarget:this,...extra}); }
  setAttribute(k,v){this.attrs[k]=v} getAttribute(k){return this.attrs[k]} removeAttribute(k){delete this.attrs[k]}
  setCustomValidity(v){this.validity=v} reportValidity(){return true} focus(){this.focused=true} select(){this.selected=true}
  querySelectorAll(){return []}
}
function load(page, denyClipboard=false) {
  const html=fs.readFileSync(new URL(page,root),'utf8');
  const elements=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>['#'+m[1],new Element()]));
  elements['.menu-toggle']=new Element(); elements['.menu-toggle'].attrs['aria-expanded']='false';
  const data={name:'Zoë & Sam',email:'zoe@example.nl',topic:'Mijn eerste huis',message:'Kunnen we € 300.000 bespreken?'};
  const form=elements['#contact-form'];
  if(form){form.elements={name:new Element()};form.elements.name.value=data.name;form.querySelectorAll=()=>[elements['#copy-message']];}
  if(elements['#goal']){elements['#goal'].valueAsNumber=10000;elements['#months'].value='24';}
  let clicked,clipboard;
  const doc={querySelector:s=>elements[s]??null,addEventListener(){},createElement:()=>({click(){clicked=this.href}})};
  const context=vm.createContext({document:doc,window:{matchMedia:()=>({addEventListener(){}})},navigator:{clipboard:{async writeText(text){if(denyClipboard)throw new Error('Denied');clipboard=text}}},FormData:class{get(k){return data[k]}},Intl,Math,Number,encodeURIComponent});
  vm.runInContext(code,context);
  return {elements,form,clicked:()=>clicked,clipboard:()=>clipboard};
}
test('shared script initializes every page without removed dialogs or absent contact forms',()=>{
  for(const page of fs.readdirSync(root).filter(p=>p.endsWith('.html'))){
    const app=load(page);
    assert.equal(app.clicked(),undefined,'initialization must not trigger email');
    if(page==='rekentools.html')assert.match(app.elements['#monthly-amount'].textContent,/417/);
  }
});
test('mail opens an encoded draft, never claims a delivered request',async()=>{
  const app=load('contact.html');await app.form.fire('submit');
  const url=new URL(app.clicked());
  assert.equal(url.protocol,'mailto:');assert.equal(url.pathname,'Contact@maasenhof.nl');
  assert.match(url.searchParams.get('body'),/Zoë & Sam/);
  assert.match(url.searchParams.get('body'),/€ 300.000/);
  assert.match(app.elements['#form-status'].textContent,/nog niet verzonden/);
});
test('copy alternative preserves message and has a usable fallback when clipboard access fails',async()=>{
  const app=load('contact.html');await app.elements['#copy-message'].fire('click');
  assert.match(app.clipboard(),/Zoë & Sam/);assert.equal(app.clicked(),undefined);
  assert.match(app.elements['#form-status'].textContent,/nog niet verzonden/);
  const fallback=load('contact.html',true);await fallback.elements['#copy-message'].fire('click');
  assert.equal(fallback.elements['#copy-fallback-field'].hidden,false);
  assert.match(fallback.elements['#copy-fallback'].value,/€ 300.000/);
  assert.equal(fallback.elements['#copy-fallback'].selected,true);
});
