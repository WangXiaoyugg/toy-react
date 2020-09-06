class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)
  }
  setAttribute(key, value) {
    if (key.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLocaleLowerCase()), value)
    } else {
      if (key === 'className') {
        this.root.setAttribute('class', value)
      } else {
        this.root.setAttribute(key, value)
      }
    }

  }
  appendChild(component) {
    let range = document.createRange()
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length);
    component._renderToDOM(range)
  }
  _renderToDOM(range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}
class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }

  _renderToDOM(range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null)
    this.children = []
    this._root = null
    this._range = null
  }
  setAttribute(key, value) {
    this.props[key] = value
  }
  appendChild(component) {
    this.children.push(component)
  }

  _renderToDOM(range) {
    this._range = range
    this.render()._renderToDOM(range)
  }

  rerender() {
    let oldRange = this._range;

    let range = document.createRange()
    range.setStart(oldRange.startContainer, oldRange.startOffset)
    range.setEnd(oldRange.startContainer, oldRange.startOffset)

    this._renderToDOM(range)
    oldRange.setStart(range.endContainer, range.endOffset)
    oldRange.deleteContents()


  }

  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.rerender()
      return;
    }
    let merge = (oldState, newState) => {
      for (let p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p]
        } else {
          merge(oldState[p], newState[p])
        }
      }
    }
    merge(this.state, newState)
    this.rerender()
  }


}


export function createElement(type, attrs, ...children) {
  let el
  if (typeof type === 'string') {
    el = new ElementWrapper(type)
  } else {
    el = new type;
  }
  for (let p in attrs) {
    el.setAttribute(p, attrs[p])
  }

  let insertChildren = (children) => {
    for (let child of children) {
      if (typeof child === 'string') {
        child = new TextWrapper(child)
      }
      if (child === null) {
        continue
      }
      if ((typeof child === 'object') && (child instanceof Array)) {
        insertChildren(child)
      } else {
        el.appendChild(child)
      }

    }
  }
  insertChildren(children)

  return el;
}
export function render(component, parentElement) {
  let range = document.createRange()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length);
  range.deleteContents()

  component._renderToDOM(range)
} 