export function renderFooter(mount) {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <p>&copy; ${new Date().getFullYear()} panda-lsy. Built with simplicity.</p>
  `;
  mount.appendChild(footer);
}
