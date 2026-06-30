// preload with contextIsolation enabled
const {contextBridge} = require('electron');
const {readdir, readFile, rm} = require('fs/promises');
const {resolve: resolvePath} = require('node:path');
const {homedir} = require('node:os');

// Paths the renderer is allowed to read/delete.
// On macOS external USB drives live under /Volumes; homedir() covers dev test paths.
const ALLOWED_ROOTS: string[] = process.platform === 'win32'
    ? ['C:\\', 'D:\\', 'E:\\', 'F:\\', 'G:\\', 'H:\\']
    : ['/Volumes', homedir()];

function assertSafePath(p: string): void {
    const resolved = resolvePath(p);
    if (!ALLOWED_ROOTS.some(root => resolved.startsWith(root))) {
        throw new Error(`Access denied: ${resolved}`);
    }
}

contextBridge.exposeInMainWorld('sentinel', {
    getFiles: (path: string) => {
        assertSafePath(path);
        return readdir(resolvePath(path))
            .then((items: string[]) => items
                .filter((val: string) => val[0] !== '.')
                .map((val: string) => `${resolvePath(path)}/${val}`));
    },
    readStringFile: (path: string) => {
        assertSafePath(path);
        return readFile(resolvePath(path)).then((buff: Buffer) => buff.toString());
    },
    readBufferFile: (path: string) => {
        assertSafePath(path);
        return readFile(resolvePath(path));
    },
    readB64File: (path: string) => {
        assertSafePath(path);
        return readFile(resolvePath(path)).then((buff: Buffer) => buff.toString('base64'));
    },
    remove: (path: string) => {
        assertSafePath(path);
        return rm(resolvePath(path), {recursive: true});
    },
})

function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
    return new Promise(resolve => {
        if (condition.includes(document.readyState)) {
            resolve(true)
        } else {
            document.addEventListener('readystatechange', () => {
                if (condition.includes(document.readyState)) {
                    resolve(true)
                }
            })
        }
    })
}

const safeDOM = {
    append(parent: HTMLElement, child: HTMLElement) {
        if (!Array.from(parent.children).find(e => e === child)) {
            return parent.appendChild(child)
        }
    },
    remove(parent: HTMLElement, child: HTMLElement) {
        if (Array.from(parent.children).find(e => e === child)) {
            return parent.removeChild(child)
        }
    },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
    const className = `loaders-css__square-spin`
    const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
    const oStyle = document.createElement('style')
    const oDiv = document.createElement('div')

    oStyle.id = 'app-loading-style'
    oStyle.innerHTML = styleContent
    oDiv.className = 'app-loading-wrap'
    oDiv.innerHTML = `<div class="${className}"><div></div></div>`

    return {
        appendLoading() {
            safeDOM.append(document.head, oStyle)
            safeDOM.append(document.body, oDiv)
        },
        removeLoading() {
            safeDOM.remove(document.head, oStyle)
            safeDOM.remove(document.body, oDiv)
        },
    }
}

// ----------------------------------------------------------------------

const {appendLoading, removeLoading} = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
    ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)
