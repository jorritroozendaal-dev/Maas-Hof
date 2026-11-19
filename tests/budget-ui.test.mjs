import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeBudgetTool } from '../budget-tool.mjs';

const html=fs.readFileSync(new URL('../src/pages/budgetplanner.html',import.meta.url),'utf8');
function app() {
  const nodes=new Map();
  const doc={querySelector:s=>nodes.get(s.slice(1))??null,activeElement:null};
  class Element {
    constructor(attrs) {
      this.attrs=attrs;this.id=attrs.id;this.value='';this.textContent='';this.hidden='hidden' in attrs;this.disabled='disabled' in attrs;this.required='required' in attrs;this.checked=false;this.listeners={};
      this.dataset={budgetLabel:attrs['data-budget-label'],budgetGroup:attrs['data-budget-group']};
    }
    addEventListener(event,fn){(this.listeners[event]??=[]).push(fn)}
    fire(type){const event={defaultPrevented:false,preventDefault(){this.defaultPrevented=true}};for(const fn of this.listeners[type]??[])fn(event);return event}
    setAttribute(key,value){this.attrs[key]=value}removeAttribute(key){delete this.attrs[key]}
    focus(){doc.activeElement=this}closest(selector){return selector==='details'&&this.dataset.budgetGroup==='other'?details:null}
  }
  for(const match of html.matchAll(/<[a-z][^>]*\bid="[^"]+"[^>]*>/g)) {
    const attrs=Object.fromEntries([...match[0].matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(m=>[m[1],m[2]??'']));
    nodes.set(attrs.id,new Element(attrs));
  }
  const fields=[...nodes.values()].filter(n=>'data-budget-amount' in n.attrs);
  const outputs=[...nodes.values()].filter(n=>'data-budget-output' in n.attrs);
  const form=nodes.get('budget-form');
  const details={open:false};
  form.querySelectorAll=selector=>selector==='[data-budget-amount]'?fields:selector==='[data-budget-action]'?[nodes.get('budget-clear'),{disabled:true}]:[];
  form.reset=()=>{for(const field of fields)field.value='';nodes.get('budget-has-partner').checked=false};
  nodes.get('budget-results').querySelectorAll=()=>outputs;
  initializeBudgetTool(doc);
  return {nodes,fields,outputs,form,doc,details,set(id,value){nodes.get(id).value=value},text(id){return nodes.get(id).textContent.replaceAll('\u00a0',' ')}};
}
test('budget starts empty and blocks a missing income instead of showing a fabricated result',()=>{
  const a=app();assert.ok(a.fields.every(n=>n.value===''));
  assert.equal(a.nodes.get('budget-results').hidden,true);assert.equal(a.nodes.get('budget-clear').disabled,false);
  assert.equal(a.nodes.get('budget-partner-income').disabled,true);
  assert.equal(a.form.fire('submit').defaultPrevented,true);
  assert.equal(a.nodes.get('budget-results').hidden,true);assert.equal(a.nodes.get('budget-error').hidden,false);
  assert.equal(a.doc.activeElement.id,'budget-income');
});
test('real page fields render the household totals and invalidate stale results on edits',()=>{
  const a=app();const toggle=a.nodes.get('budget-has-partner');toggle.checked=true;toggle.fire('change');
  assert.equal(a.nodes.get('budget-partner-field').hidden,false);assert.equal(a.nodes.get('budget-partner-income').disabled,false);
  for(const [id,value] of Object.entries({'budget-income':'3.000,50','budget-partner-income':'2.000,25','budget-other-income':'200','budget-housing':'1200,10','budget-gas':'120,20','budget-water':'30','budget-electricity':'80,05','budget-groceries':'500,40','budget-health-insurance':'200','budget-loans':'50','budget-savings':'400,10'}))a.set(id,value);
  a.form.fire('submit');assert.equal(a.text('budget-total-income'),'€ 5.200,75');assert.equal(a.text('budget-total-expenses'),'€ 2.180,75');assert.equal(a.text('budget-before-savings'),'€ 3.020,00');assert.equal(a.text('budget-remaining'),'€ 2.619,90');
  assert.equal(a.nodes.get('budget-results').hidden,false);assert.equal(a.nodes.get('budget-results').attrs['data-state'],'surplus');assert.equal(a.doc.activeElement.id,'budget-results');
  a.set('budget-groceries','800');a.form.fire('input');assert.equal(a.nodes.get('budget-results').hidden,true);assert.ok(a.outputs.every(n=>n.textContent===''));
  assert.match(a.text('budget-placeholder-text'),/gewijzigd/);
  toggle.checked=false;toggle.fire('change');assert.equal(a.nodes.get('budget-partner-income').value,'');assert.equal(a.nodes.get('budget-partner-income').disabled,true);
  a.form.fire('submit');assert.equal(a.text('budget-total-income'),'€ 3.200,50');
});
test('budget opens hidden optional expenses to reveal invalid input and removes prior results',()=>{
  const a=app();a.set('budget-income','3000');a.form.fire('submit');
  a.set('budget-loans','-10');a.form.fire('submit');
  assert.equal(a.details.open,true);assert.equal(a.doc.activeElement.id,'budget-loans');assert.equal(a.nodes.get('budget-loans').attrs['aria-invalid'],'true');
  assert.equal(a.nodes.get('budget-results').hidden,true);assert.equal(a.nodes.get('budget-error').hidden,false);
});
test('budget distinguishes a monthly shortfall from savings that do not fit',()=>{
  const a=app();a.set('budget-income','3000');a.set('budget-housing','3500');a.form.fire('submit');
  assert.equal(a.nodes.get('budget-results').attrs['data-state'],'deficit');assert.equal(a.text('budget-balance-label'),'Tekort na sparen');assert.match(a.text('budget-result-message'),/nog vóór sparen/);
  a.set('budget-housing','2500');a.set('budget-savings','600');a.form.fire('submit');assert.match(a.text('budget-result-message'),/spaardoel past nog niet/);
  a.set('budget-savings','500');a.form.fire('submit');assert.equal(a.nodes.get('budget-results').attrs['data-state'],'balanced');assert.equal(a.text('budget-remaining'),'€ 0,00');
});
test('clear action removes all entered financial values and all rendered amounts',()=>{
  const a=app();a.set('budget-income','3000');a.set('budget-gas','100');a.form.fire('submit');
  a.nodes.get('budget-clear').fire('click');
  assert.ok(a.fields.every(n=>n.value===''));assert.ok(a.outputs.every(n=>n.textContent===''));
  assert.equal(a.nodes.get('budget-results').hidden,true);assert.equal(a.nodes.get('budget-placeholder').hidden,false);assert.equal(a.nodes.get('budget-has-partner').checked,false);assert.equal(a.doc.activeElement.id,'budget-income');
  assert.match(a.text('budget-announcement'),/gewist/);
});
