const cards = [...document.querySelectorAll('.character-card')];
const filters = [...document.querySelectorAll('[data-filter]')];
const count = document.querySelector('.view-count');
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => {
    const active = filter === button;
    filter.classList.toggle('is-active', active);
    filter.setAttribute('aria-pressed', String(active));
  });
  cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.group !== button.dataset.filter; });
  count.textContent = `${cards.filter(card => !card.hidden).length} 组原画`;
}));
const dialog = document.querySelector('#artworkDialog');
document.querySelectorAll('.artwork-open').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('.character-card');
  const source = button.querySelector('img');
  const target = document.querySelector('#artworkImage');
  target.src = source.src;
  target.alt = source.alt;
  document.querySelector('#artworkTitle').textContent = card.querySelector('h2').textContent;
  document.querySelector('#artworkCaption').textContent = card.querySelector('.card-copy > p').textContent;
  dialog.showModal();
}));
document.querySelector('#closeArtwork').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
