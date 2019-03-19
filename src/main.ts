enum El {
  Wrapper = 'wrapper',
  PrimaryNavWrapper = 'primary-nav-wrapper',
  PrimaryNav = 'primary-nav',
  OverflowNav = 'overflow-nav',
  ToggleBtn = 'toggle-btn',
  NavItems = 'nav-item',
}

function eventTarget() {
  const { port1 } = new MessageChannel();
  return {
    dispatchEvent: port1.dispatchEvent.bind(port1),
    addEventListener: port1.addEventListener.bind(port1),
  };
}

function pplus(targetElem, options) {
  const eventChannel = eventTarget();

  const el = {
    primary: {
      [El.Wrapper]: undefined,
      [El.PrimaryNav]: undefined,
      [El.NavItems]: undefined,
      [El.OverflowNav]: undefined,
      [El.ToggleBtn]: undefined,
    },
    clone: {
      [El.Wrapper]: undefined,
      [El.NavItems]: undefined,
      [El.ToggleBtn]: undefined,
    },
  };

  const classNames = {
    [El.Wrapper]: ['p-plus'],
    [El.PrimaryNavWrapper]: ['p-plus__primary-wrapper'],
    [El.PrimaryNav]: ['p-plus__primary'],
    [El.OverflowNav]: ['p-plus__overflow'],
    [El.ToggleBtn]: ['p-plus__toggle-btn'],
  };

  const getElemMirror = (() => {
    const cache = new Map();

    return function getMirror(keyArr, valueArr) {
      if (!cache.get(keyArr)) {
        cache.set(
          keyArr,
          new Map(Array.from(keyArr).reduce((acc, item, i) => (
            acc.concat([[item, valueArr[i]]])
          ), []))
        );
      }

      return cache.get(keyArr);
    };
  })();

  function cn(key: El) {
    return classNames[key].join(' ');
  }

  function dv(key: El) {
    return `data-${key}`;
  }

  function createMarkup() {
    return `
      <div ${dv(El.Wrapper)} class="${cn(El.Wrapper)}">
        <div class="${cn(El.PrimaryNavWrapper)}">
          <${targetElem.tagName} 
            ${dv(El.PrimaryNav)}
            class="${cn(El.PrimaryNav)}"
          >
            ${Array.from(targetElem.children).map((elem: HTMLElement) => (
              `<li ${dv(El.NavItems)}>${elem.innerHTML}</li>`
            )).join('')}
          </${targetElem.tagName}>
        </div>
        <${targetElem.tagName} 
          ${dv(El.OverflowNav)}
          class="${cn(El.OverflowNav)}"
        >
        </${targetElem.tagName}>
        <button
          ${dv(El.ToggleBtn)}
          class="${cn(El.ToggleBtn)}"
        >More</button>
      <div>
    `;
  }

  function setupEl() {
    const markup = createMarkup();
    const container = document.createDocumentFragment();

    const original = document.createRange().createContextualFragment(markup);
    const cloned = <Element>original.cloneNode(true);

    el.primary[El.Wrapper] = original.querySelector(`[${dv(El.Wrapper)}]`);
    el.primary[El.PrimaryNav] = original.querySelector(`[${dv(El.PrimaryNav)}]`);
    el.primary[El.NavItems] = original.querySelectorAll(`[${dv(El.NavItems)}]`);
    el.primary[El.OverflowNav] = original.querySelector(`[${dv(El.OverflowNav)}]`);
    el.primary[El.ToggleBtn] = original.querySelector(`[${dv(El.ToggleBtn)}]`);
    el.primary[El.ToggleBtn].style.display = 'none';

    el.clone[El.Wrapper] = cloned.querySelector(`[${dv(El.Wrapper)}]`);
    el.clone[El.NavItems] = Array.from(cloned.querySelectorAll(`[${dv(El.NavItems)}]`));
    el.clone[El.ToggleBtn] = cloned.querySelector(`[${dv(El.ToggleBtn)}]`);

    container.appendChild(original);
    container.appendChild(cloned);

    targetElem.parentNode.replaceChild(container, targetElem);
  }

  function onIntersect({ target, intersectionRatio }) {
    const targetElem = getElemMirror(el.clone[El.NavItems], el.primary[El.NavItems]).get(target);
    const navToPopulate = intersectionRatio < 1 ? El.OverflowNav : El.PrimaryNav;

    if (!targetElem) return;

    targetElem.remove();
    el.primary[navToPopulate].appendChild(targetElem);

    updateBtnDisplay();
  }

  function updateBtnDisplay() {
    [el.primary[El.ToggleBtn], el.clone[El.ToggleBtn]].forEach((btn) => {
      btn.style.display = el.primary[El.OverflowNav].children.length > 0 ? 'block' : 'none';
    })
  }

  function intersectionCallback(e) {
    e.forEach(onIntersect);
    eventChannel.dispatchEvent(new CustomEvent('intersect'));
  }

  function bindListeners() {
    const observer = new IntersectionObserver(intersectionCallback, {
      root: el.clone[El.Wrapper],
      rootMargin: '0px 0px 0px 0px',
      threshold: [0, 1],
    });

    el.clone[El.NavItems].forEach(elem => observer.observe(elem));
  }

  function on(eventType, cb) {
    return eventChannel.addEventListener(eventType, cb);
  }

  (function init() {
    setupEl();
    bindListeners();
    eventChannel.dispatchEvent(new CustomEvent('init'));
  }());

  return {
    on,
  };
}

export default pplus;
