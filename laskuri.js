"use strict";

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-bs-theme','dark');
}
else {
  document.documentElement.setAttribute('data-bs-theme','light');
}

const $ = document.querySelector.bind(document);
const $all = document.querySelectorAll.bind(document);
const $id = document.getElementById.bind( document );
const $class = document.getElementsByClassName.bind(document);
const $tag = document.getElementsByTagName.bind(document);

const dropItems = [
  { name: 'DIN kW', value: 'DIN kW' },
  { name: 'DIN hp (SI)', value: 'DIN hp (SI)' },
  { name: 'DIN hp (USC/IU)', value: 'DIN hp (USC/IU)' },
  { name: 'SAE net kW', value: 'SAE net kW' },
  { name: 'SAE net hp (USC/IU)', value: 'SAE net hp' },
  { name: 'SAE gross kW', value: 'SAE gross kW' },
  { name: 'SAE gross hp (USC/IU)', value: 'SAE gross hp' }
];

const precision = 4;
const siHorsePower = 0.73549875;
const uscHorsePower = 0.7457;
const pound = 0.45359237;
const weight2PowerRatios = {
  1: [ 20, -12 ],
  2: [ 20, 10 ],
  3: [ 15, 7 ],
  4: [ 10, 5 ],
  5: [ 5, 4 ],
};

const alertSuccessClass = 'alert-success';
const alertWarningClass = 'alert-warning';
const alertDangerClass = 'alert-danger';
const alertClasses = [alertSuccessClass, alertWarningClass, alertDangerClass];

function addEventListeners(arr, eventType, fn) {
  if (Array.isArray(arr) === false) {
    arr = Array.from(arr);
  }
  arr.forEach(function (arrItem) {
    arrItem.addEventListener(eventType, fn);
  });
}
function callEventListeners(arr, eventType) {
  if (Array.isArray(arr) === false) {
    arr = Array.from(arr);
  }
  arr.forEach(function (arrItem) {
    arrItem.dispatchEvent(new Event(eventType));
  });
}

function isString(variable) {
  return typeof variable === 'string' || variable instanceof String;
}

function floatValue(value) {
  if (value == null || value == '') {
    return 0;
  }
  if (isString(value) && value.indexOf(',') > 0) {
    value = value.replace(",", ".");
  }
  return parseFloat(value);
}

function formatFloatValue(value) {
  let v = value.toFixed(precision);
  if (isString(v) && v.indexOf('.') > 0) {
    return v.replace(".", ",");
  }
  return v;
}

function formatPercentValue(value) {
  value = value * 100;
  let v = value.toFixed(Math.max(precision - 2, 0));
  if (isString(v) && v.indexOf('.') > 0) {
    return v.replace(".", ",") + ' %';
  }
  return v + ' %';
}

function round(value) {
  value = parseFloat(value);
  value = value.toFixed(precision);
  value = parseFloat(value);
  return value;
}

function convertPowerToDIN(inputPower, inputType) {
  inputPower = floatValue(inputPower);
  let dinPower = 0;

  switch (inputType) {
    case 'DIN hp (SI)':
      dinPower = inputPower * siHorsePower;
      break;
    case 'DIN hp (USC/IU)':
      dinPower = inputPower * uscHorsePower;
      break;
    case 'SAE net hp':
      dinPower = inputPower * uscHorsePower * 0.9;
      break;
    case 'SAE gross hp':
      dinPower = inputPower * uscHorsePower * 0.7;
      break;
    case 'SAE net kW':
      dinPower = inputPower * 0.9;
      break;
    case 'SAE gross kW':
      dinPower = inputPower * 0.7;
      break;
    default: // DIN kW
      dinPower = inputPower;
      break;
  }

  return Math.ceil(dinPower);
}

function convertPowerFromDIN(dinPower, inputType) {
  dinPower = floatValue(dinPower);
  let outPower = 0;

  switch (inputType) {
    case 'DIN hp (SI)':
      outPower = dinPower / siHorsePower;
      break;
    case 'DIN hp (USC/IU)':
      outPower = dinPower / uscHorsePower;
      break;
    case 'SAE net hp':
      outPower = dinPower / uscHorsePower / 0.9;
      break;
    case 'SAE gross hp':
      outPower = dinPower / uscHorsePower / 0.7;
      break;
    case 'SAE net kW':
      outPower = dinPower / 0.9;
      break;
    case 'SAE gross kW':
      outPower = dinPower / 0.7;
      break;
    default: // DIN kW
      outPower = dinPower;
      break;
  }

  return Math.round(outPower);
}

function getMaxPower() {
  const oldPower = floatValue($id('comparisonPower').value);

  const oldWeight = floatValue($id('comparisonWeight').value);
  let newWeight = floatValue($id('newWeight').value);

  if (newWeight == 0) {
    newWeight = oldWeight;
    const newWeightElement = $id('newWeight');
    newWeightElement.value = Math.round(newWeight);
    calculateWeight(newWeightElement);
  }

  const oldWeight2Power = (oldWeight / oldPower);
  let newWeight2Power;

  for (const entry in weight2PowerRatios) {
    if (weight2PowerRatios.hasOwnProperty(entry)) {
      const w2p = weight2PowerRatios[entry][0];
      const w2pmax = weight2PowerRatios[entry][1];
      if (w2pmax < 0 && oldWeight2Power > w2p) {
        newWeight2Power = w2pmax * -1;
      }
      else if (oldWeight2Power <= w2p) {
        newWeight2Power = w2pmax;
      }
    }
  }

  const newPower = newWeight / newWeight2Power;

  return Math.floor(newPower);
}

function validate() {
  let invalidInput = true;
  const requiredInputs = $all('input[required]');

  requiredInputs.forEach(function (el) {
    if (!el.value) {
      el.classList.add('invalid');
      invalidInput = false;
    }
    else {
      el.classList.remove('invalid');
    }
  });
  return invalidInput;
}

function calculate() {
  const resultPowerElement = $id('resultPower');
  const resultWeight2PowerElement = $id('resultWeight2Power');

  resultPowerElement.textContent = '';
  resultWeight2PowerElement.textContent = '';
  resultPowerElement.classList.remove(...alertClasses);
  resultWeight2PowerElement.classList.remove(...alertClasses);

  if (!validate()) {
    return;
  }

  const comparisonPowerElement = $id('comparisonPower');
  const newPowerElement = $id('newPower');
  const oldPower = floatValue(comparisonPowerElement.value);
  let newPower = floatValue(newPowerElement.value);

  if (newPower == 0) {
    newPower = getMaxPower();
    let newConvertedPower = convertPowerFromDIN(newPower, 'DIN hp (SI)');
    newPowerElement.value = newPower;
    $id('newPowerHp').value = Math.floor(newConvertedPower);
    const btnObj = $('section#new button');
    newConvertedPower = convertPowerFromDIN(newPower, btnObj.value);
    $id('newInputPower').value = newConvertedPower;
  }

  const resultPower = round(newPower / oldPower);
  let resultPowerText = 'Tehon kasvu ' + formatPercentValue(resultPower - 1);

  if (resultPower < 1.2) {
    resultPowerElement.classList.add(alertSuccessClass);
  }
  else if (resultPower > 1.2) {
    resultPowerText += '<br>Teho kasvaa yli 20 %. Muutettava vertailuajoneuvoa vastaavaksi ja sovelletaan omamassa-teho-suhdetta.';
    resultPowerElement.classList.add(alertDangerClass);
  }
  else {
    resultPowerElement.classList.add(alertWarningClass);
  }
  resultPowerElement.innerHTML = resultPowerText;

  const newWeightElement = $id('newWeight');
  const comparisonWeight = $id('comparisonWeight').value;
  const oldWeight = floatValue(comparisonWeight);
  let newWeight = floatValue(newWeightElement.value);

  if (newWeight == 0) {
    newWeight = oldWeight;
    newWeightElement.value = comparisonWeight;
    calculateWeight(newWeightElement);
  }

  const oldWeight2Power = oldWeight / oldPower;
  const newWeight2Power = newWeight / newPower;

  let resultWeight2PowerText = 'Omamassan suhde tehoon ' + formatFloatValue(newWeight2Power) + ' kg/kW';

  let weight2PowerClass = alertSuccessClass;

  for (const entry in weight2PowerRatios) {
    const w2p = weight2PowerRatios[entry][0];
    let w2pmax = weight2PowerRatios[entry][1];
    if (w2pmax < 0 && oldWeight2Power > w2p) {
      w2pmax *= -1;
      resultWeight2PowerText = '<br>Vanha suhde ' + formatFloatValue(oldWeight2Power) + ' kg/kW<br>Vanha suhde on yli ' + w2p + ' kg/kW, uusi suhde ei saa mennä alle ' + w2pmax + ' kg/kW.';
      if (newWeight2Power < w2pmax) {
        weight2PowerClass = alertDangerClass;
      }
      else if (round(newWeight2Power) == w2pmax) {
        weight2PowerClass = alertWarningClass;
      }
      else {
        weight2PowerClass = alertSuccessClass;
      }
    }
    else if (oldWeight2Power <= w2p) {
      resultWeight2PowerText = '<br>Vanha suhde ' + formatFloatValue(oldWeight2Power) + ' kg/kW<br>Vanha suhde on alle ' + w2p + ' kg/kW, uusi suhde ei saa mennä alle ' + w2pmax + ' kg/kW.';
      if (newWeight2Power < w2pmax) {
        weight2PowerClass = alertDangerClass;
      }
      else if (round(newWeight2Power) == w2pmax) {
        weight2PowerClass = alertWarningClass;
      }
      else {
        weight2PowerClass = alertSuccessClass;
      }
    }
  }
  resultWeight2PowerElement.classList.add(weight2PowerClass);

  resultWeight2PowerText = 'Omamassan suhde tehoon ' + formatFloatValue(newWeight2Power) + ' kg/kW' + resultWeight2PowerText;

  resultWeight2PowerElement.innerHTML = resultWeight2PowerText;
}

function calculatePower(input) {
  const parentDiv = input.parentElement;
  const btnObj = parentDiv.querySelector('button');
  const newPower = convertPowerToDIN(input.value, btnObj.value);
  const newConvertedPower = convertPowerFromDIN(newPower, 'DIN hp (SI)');
  parentDiv.parentElement.querySelector('div.input-group.kw input[readonly]').value = newPower;
  parentDiv.parentElement.querySelector('div.input-group.hp input[readonly]').value = newConvertedPower;
}

function calculateWeight(input) {
  const id = input.id;
  const inputValue = floatValue(input.value);
  if (id == 'comparisonWeightLb' || id == 'newWeightLb') {
    const kgWeight = Math.ceil(inputValue * pound);
    input.parentElement.parentElement.querySelector('div.input-group.kg input').value = kgWeight;
  }
  else {
    const lbWeight = Math.round(inputValue / pound);
    input.parentElement.parentElement.querySelector('div.input-group.lb input').value = lbWeight;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  Array.from($class('dropdown-menu')).forEach(function (el) {
    dropItems.forEach(function (dropItem) {
      const a = document.createElement('a');
      a.setAttribute('data-value', dropItem.value);
      a.classList.add('dropdown-item');
      const textnode = document.createTextNode(dropItem.name);
      a.appendChild(textnode);
      const li = document.createElement('li');
      li.appendChild(a);
      el.appendChild(li);
    });
  });

  $id('submitbutton').addEventListener('click', function () {
    calculate();
  });

  $id('maxbutton').addEventListener('click', function () {
    if (!validate()) {
      calculate();
      return;
    }

    const newPower = getMaxPower();
    let newConvertedPower = convertPowerFromDIN(newPower, 'DIN hp (SI)');
    $id('newPower').value = newPower;
    $id('newPowerHp').value = newConvertedPower;

    const btnObj = $('section#new button');
    newConvertedPower = convertPowerFromDIN(newPower, btnObj.value);
    $id('newInputPower').value = newConvertedPower;

    calculate();
  });

  addEventListeners($class('dropdown-item'), 'click', function (event) {
    const thisElement = event.currentTarget;
    const btnObj = thisElement.parentElement.parentElement.parentElement.querySelector('button');
    const thisElementValue = thisElement.getAttribute('data-value');
    btnObj.textContent = thisElementValue;
    btnObj.value = thisElementValue;

    const input = btnObj.parentElement.querySelector('input');
    calculatePower(input);
    calculate();
  });

  addEventListeners($class('input-power'), 'change', function (event) {
    const thisElement = event.currentTarget;
    calculatePower(thisElement);
  });

  addEventListeners($class('input-power'), 'keyup', function (event) {
    const thisElement = event.currentTarget;
    calculatePower(thisElement);
  });

  addEventListeners($class('input-weight'), 'change', function (event) {
    const thisElement = event.currentTarget;
    calculateWeight(thisElement);
  });
  
  addEventListeners($class('input-weight'), 'keyup', function (event) {
    const thisElement = event.currentTarget;
    calculateWeight(thisElement);
  });

  addEventListeners($tag('input'), 'change', function () {
    calculate();
  });
  addEventListeners($tag('input'), 'dblclick', function (event) {
    const thisElement = event.currentTarget;
    thisElement.select();
  });

  $id('flexSwitchCheckDefault').addEventListener('click', function () {
    if (document.documentElement.getAttribute('data-bs-theme') == 'dark') {
      document.documentElement.setAttribute('data-bs-theme','light');
    }
    else {
      document.documentElement.setAttribute('data-bs-theme','dark');
    }
  });

  $id('precision').textContent = precision;
  $id('siHorsePower').textContent = formatFloatValue(siHorsePower);
  $id('uscHorsePower').textContent = formatFloatValue(uscHorsePower);
  callEventListeners($id('maxbutton'), 'click');
  calculate();
  //callEventListeners($all('.kg .input-weight'), 'keyup');
});
