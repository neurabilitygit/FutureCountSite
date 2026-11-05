const menuButton = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');

if (menuButton && navigation) {
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.textContent = open ? 'Close −' : 'Menu +';
    navigation.classList.toggle('open', open);
  }

  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });

  navigation.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenu(false));
  });

  matchMedia('(min-width:761px)').addEventListener('change', event => {
    if (event.matches) setMenu(false);
  });
}
