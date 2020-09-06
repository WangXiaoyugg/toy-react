
function createElement(tag, attrs, ...children) {
  let el = document.createElement(tag)
  for (let p in attrs) {
    el.setAttribute(p, attrs[p])
  }
  for (let child of children) {
    if (typeof child === 'string') {
      child = document.createTextNode(child)
    }
    el.appendChild(child)

  }
  return el;
}
document.body.appendChild(<div id="a" class="c">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>)