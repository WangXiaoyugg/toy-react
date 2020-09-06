
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
  get vdom() {
    return this.render().vdom
  }
  get vchildren() {
    return this.children.map(child => child.vdom)
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

class ElementWrapper extends Component {
  constructor(type) {
    super()
    this.root = document.createElement(type)
    this.type = type
  }
  // setAttribute(key, value) {
  //   if (key.match(/^on([\s\S]+)$/)) {
  //     this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLocaleLowerCase()), value)
  //   } else {
  //     if (key === 'className') {
  //       this.root.setAttribute('class', value)
  //     } else {
  //       this.root.setAttribute(key, value)
  //     }
  //   }
  // }
  // appendChild(component) {
  //   let range = document.createRange()
  //   range.setStart(this.root, this.root.childNodes.length)
  //   range.setEnd(this.root, this.root.childNodes.length);
  //   component._renderToDOM(range)
  // }
  _renderToDOM(range) {
    let root = document.createElement(this.type)

    for (let name in this.props) {
      let value = this.props[name]
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLocaleLowerCase()), value)
      } else {
        if (name === 'className') {
          root.setAttribute('class', value)
        } else {
          root.setAttribute(name, value)
        }
      }
    }

    for (let child of this.children) {
      let childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length);
      child._renderToDOM(childRange)
    }

    range.insertNode(root)
  }

  get vdom() {
    return {
      type: this.type,
      props: this.props,
      children: this.children.map(child => child.vdom)
    }
  }
}
class TextWrapper extends Component {
  constructor(content) {
    super()
    this.root = document.createTextNode(content)
    this.content = content
    this.type = '#text'
  }

  get vdom() {
    return this;
  }

  _renderToDOM(range) {
    range.deleteContents()
    range.insertNode(this.root)
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