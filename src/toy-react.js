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

  _renderToDOM(range) {
    this._range = range
    this._vdom = this.vdom;
    this._vdom._renderToDOM(range)
  }

  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        return false
      }
      for (let name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false
        }
      }
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
        return false
      }

      if (newNode.type === '#text') {
        if (newNode.content !== oldNode.content) {
          return false
        }
      }

      return true;
    }
    let update = (oldNode, newNode) => {
      // type, props, 对比根节点
      // #text, content， 对比子节点
      if (!isSameNode(oldNode, newNode)) {
        newNode._renderToDOM(oldNode._range)
        return;
      }
      newNode._range = oldNode._range;

      let newChildren = newNode.vchildren;
      let oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) {
        return;
      }

      let tailRange = oldChildren[oldChildren.length - 1]._range;

      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i]
        let oldChild = oldChildren[i]
        if (i < oldChildren.length) {
          update(oldChild, newChild)
        } else {
          let range = document.createRange()
          range.setStart(tailRange.endContainer, tailRange.endOffset)
          range.setEnd(tailRange.endContainer, tailRange.endOffset)
          newChild._renderToDOM(range)
          tailRange = range;

        }
      }
    }
    let vdom = this.vdom;
    update(this._vdom, vdom)
    this._vdom = vdom;
  }


  // rerender() {
  //   let oldRange = this._range;

  //   let range = document.createRange()
  //   range.setStart(oldRange.startContainer, oldRange.startOffset)
  //   range.setEnd(oldRange.startContainer, oldRange.startOffset)

  //   this._renderToDOM(range)
  //   oldRange.setStart(range.endContainer, range.endOffset)
  //   oldRange.deleteContents()
  // }

  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.update()
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
    this.update()
  }

}

class ElementWrapper extends Component {
  constructor(type) {
    super()
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

  get vdom() {
    this.vchildren = this.children.map(child => child.vdom)
    return this;
  }

  _renderToDOM(range) {
    this._range = range
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

    if (!this.vchildren) {
      this.vchildren = this.children.map(child => child.vdom)
    }

    for (let child of this.vchildren) {
      let childRange = document.createRange()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length);
      child._renderToDOM(childRange)
    }

    replaceContent(range, root)
  }

}
class TextWrapper extends Component {
  constructor(content) {
    super()
    this.content = content
    this.type = '#text'
  }

  get vdom() {
    return this;
  }

  _renderToDOM(range) {
    this._range = range;
    let root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
}

function replaceContent(range, node) {
  range.insertNode(node)
  range.setStartAfter(node)
  range.deleteContents()

  range.setStartBefore(node)
  range.setEndAfter(node)
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