// A browser barrier for task content; keep editing students' own answers usable.
(() => {
  const editable = target => {
    if (!(target instanceof Element)) return false;
    const field = target.closest('input, textarea, [contenteditable="true"]');
    if (!field || field.readOnly || field.disabled) return false;
    return field.tagName !== 'INPUT' || ['text', 'search', 'tel', 'url', 'email', 'number', 'password'].includes(field.type);
  };
  for (const type of ['selectstart', 'copy', 'cut', 'contextmenu']) {
    document.addEventListener(type, event => {
      if (!editable(event.target)) event.preventDefault();
    });
  }
})();
