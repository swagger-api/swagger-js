export default class ContextTree {
  constructor(value) {
    this.root = createNode(value || {});
  }
  set(path, value) {
    const parent = this.getParent(path, true);
    if (!parent) {
      updateNode(this.root, value, null);
      return;
    }
    const key = path[path.length - 1];
    const {
      children
    } = parent;
    if (children[key]) {
      updateNode(children[key], value, parent);
      return;
    }
    children[key] = createNode(value, parent);
  }

  // Get the "best" node (node or nearest parent) and return its value.
  get(path) {
    path = path || [];
    if (path.length < 1) {
      return this.root.value;
    }
    let branch = this.root;
    let child;
    let token;
    for (let i = 0; i < path.length; i += 1) {
      token = path[i];
      child = branch.children;
      if (!child[token]) {
        break;
      }
      branch = child[token];
    }
    return branch && branch.protoValue;
  }
  getParent(path, ensureExists) {
    if (!path || path.length < 1) {
      return null;
    }
    if (path.length < 2) {
      return this.root;
    }
    return path.slice(0, -1).reduce((branch, token) => {
      if (!branch) {
        return branch;
      }
      const {
        children
      } = branch;
      if (!children[token] && ensureExists) {
        children[token] = createNode(null, branch);
      }
      return children[token];
    }, this.root);
  }
}

// =========================
// Utilities
// =========================

function createNode(value, parent) {
  return updateNode({
    children: {}
  }, value, parent);
}
function updateNode(node, value, parent) {
  node.value = value || {};
  node.protoValue = parent ? {
    ...parent.protoValue,
    ...node.value
  } : node.value;
  Object.keys(node.children).forEach(prop => {
    const child = node.children[prop];
    node.children[prop] = updateNode(child, child.value, node);
  });
  return node;
}