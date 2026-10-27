let theme = 'light';
if (window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
try {
	const saved = localStorage.getItem('theme');
	if (saved) theme = saved;
	if (localStorage.getItem('colorblind')) document.documentElement.dataset.colorblind = '';
} catch {}
document.documentElement.dataset.theme = theme;
