const removeIconInNode = (el: HTMLElement): void => {
  const iconNode = el.querySelector('.obsidian-icon-folder-icon');
  if (!iconNode) {
    return;
  }

  iconNode.remove();
};

const removeIconInPath = (path: string): void => {
  const node = document.querySelector(`[data-path="${path}"]`) as HTMLElement | undefined;
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

  removeIconInNode(node);
};

export default {
  removeIconInNode,
  removeIconInPath,
};
