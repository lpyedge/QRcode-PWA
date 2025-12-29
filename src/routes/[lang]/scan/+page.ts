import { locales } from '$lib/i18n';

export const prerender = true;

export const entries = () => locales.map((lang) => ({ lang }));
