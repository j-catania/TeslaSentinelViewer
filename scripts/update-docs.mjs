#!/usr/bin/env node
/**
 * Syncs the tech-stack version chips in docs/index.html from package.json.
 * Invoked automatically via the `version` npm lifecycle hook (pnpm version X.Y.Z).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const htmlPath = resolve(root, 'docs', 'index.html');
let html = readFileSync(htmlPath, 'utf8');

/** Strip range specifiers and return the major version number as a string. */
function major(v) {
    return v.replace(/^[\^~>=<\s]+/, '').split('.')[0];
}

const all = { ...pkg.dependencies, ...pkg.devDependencies };

const chips = [
    { label: 'Electron', dep: 'electron', prefix: '' },
    { label: 'React', dep: 'react', prefix: '' },
    { label: 'Vite', dep: 'vite', prefix: '' },
    { label: 'TypeScript', dep: 'typescript', prefix: '' },
    { label: 'Material UI', dep: '@mui/material', prefix: 'v' },
];

for (const { label, dep, prefix } of chips) {
    if (!all[dep]) {
        console.warn(`  ! ${label}: dependency "${dep}" not found in package.json, skipping.`);
        continue;
    }
    const version = `${prefix}${major(all[dep])}`;
    const re = new RegExp(`(${label.replace(' ', '\\s')} <span class="version">)[^<]*(</span>)`);
    if (!re.test(html)) {
        console.warn(`  ~ ${label}: no match found in HTML`);
        continue;
    }
    html = html.replace(re, `$1${version}$2`,
    );
    console.log(`  ✓ ${label}: ${version}`);
}

writeFileSync(htmlPath, html);
console.log('\ndocs/index.html updated.');
