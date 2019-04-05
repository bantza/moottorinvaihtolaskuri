window.onload=function(){
  var precision = 4;
  var siHorsePower = 0.73549875;
  var uscHorsePower = 0.7457;
  var cubicInch = 2.54 * 2.54 * 2.54;
  var pound = 0.45359237; 

  function floatValue(value) {
    if (value == null || value == '') {
      return 0;
    }
    if (value.indexOf(',') > 0) {
      value = value.replace(",", ".");
    }
    return parseFloat(value);
  }

  function formatFloatValue(value) {
    var v = value.toFixed(precision);
    if (v.indexOf('.') > 0) {
      return v.replace(".", ",");
    }
    return v;
  }

  function formatPercentValue(value) {
    value = value * 100;
    var v = value.toFixed(Math.max(precision - 2, 0));
    if (v.indexOf('.') > 0) {
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
    let dinPower = 0;

    switch (inputType) {
      case 'DIN hp (SI)':
        dinPower = inputPower * siHorsePower;
        break;
      case 'DIN hp (USC/IU)':
        dinPower = inputPower * uscHorsePower;
        break;
      case 'SAE net hp (USC/IU)':
        dinPower = inputPower * uscHorsePower * 0.9;
        break;
      case 'SAE gross hp (USC/IU)':
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
    let outPower = 0;

    switch (inputType) {
      case 'DIN hp (SI)':
        outPower = dinPower / siHorsePower;
        break;
      case 'DIN hp (USC/IU)':
        outPower = dinPower / uscHorsePower;
        break;
      case 'SAE net hp (USC/IU)':
        outPower = dinPower / uscHorsePower / 0.9;
        break;
      case 'SAE gross hp (USC/IU)':
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
    let oldPower = floatValue($('#comparisonPower').val());
    let newPower = oldPower * 1.2;

    let oldWeight = floatValue($('#comparisonWeight').val());
    let newWeight = floatValue($('#newWeight').val());

    if (newWeight == 0) {
      newWeight = oldWeight;
    }

    let oldWeight2Power = (oldWeight / oldPower);
    let newWeight2Power = (newWeight / newPower);

    if (newWeight2Power < 7) {
      if (oldWeight2Power <= 10) {
        let newPercentPower = newWeight / (oldWeight2Power * 0.7);
        let newWeightPower = newWeight / 5;
        newPower = Math.min(newPower, newWeightPower);
        newPower = Math.min(newPower, newPercentPower);
      }
      else {
        newPower = Math.min(newPower, newWeight / 7);
      }
    }

    return Math.floor(newPower);
  }

  function validate() {
    let invalidInput = true;
    $('input[required]').each(function(index, el) {
      if (!$(el).val()) {
        $(el).addClass('invalid');
        invalidInput = false;
      }
      else {
        $(el).removeClass('invalid');
      }
    });
    return invalidInput;
  }

  function calculate() {
    $('#resultPower').text('');
    $('#resultSize').text('');
    $('#resultWeight2Power').text('');
    $('#resultLiterPower').text('');
    $('#resultPower').removeClass('bg-success bg-danger bg-warning');
    $('#resultSize').removeClass('bg-success bg-danger bg-warning');
    $('#resultWeight2Power').removeClass('bg-success bg-danger bg-warning');
    $('#resultLiterPower').removeClass('bg-success bg-danger bg-warning');

    if (!validate()) {
      return;
    }

    let oldPower = floatValue($('#comparisonPower').val());
    let newPower = floatValue($('#newPower').val());

    if (newPower == 0) {
      newPower = getMaxPower();
      let newConvertedPower = convertPowerFromDIN(newPower, 'DIN hp (SI)');
      $('#newPower').val(newPower);
      $('#newPowerHp').val(Math.floor(newConvertedPower));
      let btnObj = $('#newInputPower').siblings('div.input-group-btn').find('button');
      newConvertedPower = convertPowerFromDIN(newPower, $(btnObj).val());
      $('#newInputPower').val(newConvertedPower);
    }

    let resultPower = round(newPower / oldPower);
    let resultPowerText = 'Tehon kasvu ' + formatPercentValue(resultPower - 1);

    if (resultPower < 1.2) {
      $('#resultPower').addClass('bg-success');
    }
    else if (resultPower > 1.2) {
      resultPowerText += '<br>Teho ei saa kasvaa yli 20 %.';
      $('#resultPower').addClass('bg-danger');
    }
    else {
      $('#resultPower').addClass('bg-warning');
    }
    $('#resultPower').html(resultPowerText);

    let oldSize = floatValue($('#comparisonSize').val());
    let newSize = floatValue($('#newSize').val());

    if (newSize == 0) {
      newSize = Math.floor(oldSize * 1.25);
      $('#newSize').val(newSize);
    }

    let resultSize = round(newSize / oldSize);

    let resultSizeText = 'Iskutilavuuden kasvu ' + formatPercentValue(resultSize - 1);

    if (resultSize < 1.25) {
      $('#resultSize').addClass('bg-success');
    }
    else if (resultSize > 1.25) {
      resultSizeText += '<br>Iskutilavuus ei saa kasvaa yli 25 %.'
      $('#resultSize').addClass('bg-danger');
    }
    else {
      $('#resultSize').addClass('bg-warning');
    }
    $('#resultSize').html(resultSizeText);

    let oldWeight = floatValue($('#comparisonWeight').val());
    let newWeight = floatValue($('#newWeight').val());

    if (newWeight == 0) {
      newWeight = oldWeight;
      $('#newWeight').val($('#comparisonWeight').val());
    }

    let oldWeight2Power = oldWeight / oldPower;
    let newWeight2Power = newWeight / newPower;

    let resultWeight2PowerText = 'Omamassan suhde tehoon ' + formatFloatValue(newWeight2Power) + ' kg/kW';

    if (round(newWeight2Power) < 7) {
      if (round(oldWeight2Power) <= 10) {
        resultWeight2PowerText += '<br>Vanha suhde ' + formatFloatValue(oldWeight2Power) + ' kg/kW';
        resultWeight2PowerText += '<br>Vanha suhde on alle 10 kg/kW, uusi suhde ei saa pienentyä yli 30 % eikä mennä alle 5 kg/kW.';
        if (round(newWeight2Power) < 5 || round(1 - newWeight2Power / oldWeight2Power) > 0.3) {
          $('#resultWeight2Power').addClass('bg-danger');
        }
        else if (round(newWeight2Power) == 5 || round(1 - newWeight2Power / oldWeight2Power) == 0.3) {
          $('#resultWeight2Power').addClass('bg-warning');
        }
        else {
          $('#resultWeight2Power').addClass('bg-success');
        }
      }
      else {
        resultWeight2PowerText += '<br>Vanha suhde on yli 10 kg/kW, uusi suhde ei saa olla alle 7 kg/kW.';
        $('#resultWeight2Power').addClass('bg-danger');
      }
    }
    else if (round(newWeight2Power) == 7) {
      $('#resultWeight2Power').addClass('bg-warning');
    }
    else {
      $('#resultWeight2Power').addClass('bg-success');
    }

    $('#resultWeight2Power').html(resultWeight2PowerText);

    let newLiterPower = round(newPower / newSize * 1000);

    let newLiterPowerText = 'Litrateho ' + formatFloatValue(newLiterPower) + ' kW/l';

    if (newLiterPower < 30) {
      $('#resultLiterPower').addClass('bg-warning');
      newLiterPowerText += '<br>Rekisteriotteeseen tulee merkitä moottorin teho ja polttoaineensyöttölaitteiston merkki ja malli.';
    }
    else if (newLiterPower == 30) {
      $('#resultLiterPower').addClass('bg-warning');
    }
    else {
      $('#resultLiterPower').addClass('bg-success');
    }

    $('#resultLiterPower').html(newLiterPowerText);
  }

  function calculatePower(input) {
    let btnObj = $(input).siblings('div.input-group-btn').find('button');
    let newPower = convertPowerToDIN(floatValue($(input).val()), $(btnObj).val());
    let newConvertedPower = convertPowerFromDIN(newPower, 'DIN hp (SI)');
    $(input).parent().siblings('div.input-group.kw').find('input[readonly]').val(newPower);
    $(input).parent().siblings('div.input-group.hp').find('input[readonly]').val(newConvertedPower);
  }

  function calculateSize(input) {
    if (input.id == 'comparisonSizeIn' || input.id == 'newSizeIn') {
      let ccSize = Math.ceil(floatValue($(input).val()) * cubicInch);
      $(input).parent().siblings('div.input-group.cc').find('input[readonly]').val(ccSize);
    }
    else {
      let inchSize = Math.round(floatValue($(input).val()) / cubicInch);
      $(input).parent().siblings('div.input-group.in').find('input[readonly]').val(inchSize);
    }
  }

  function calculateWeight(input) {
    if (input.id == 'comparisonWeightLb' || input.id == 'newWeightLb') {
      let kgWeight = Math.ceil(floatValue($(input).val()) * pound);
      $(input).parent().siblings('div.input-group.kg').find('input[readonly]').val(kgWeight);
    }
    else {
      let lbWeight = Math.round(floatValue($(input).val()) / pound);
      $(input).parent().siblings('div.input-group.lb').find('input[readonly]').val(lbWeight);
    }
  }

  $('#submitbutton').click(function() {
    calculate();
  });

  $('#maxbutton').click(function() {
    if (!validate()) {
      calculate();
      return;
    }

    let newPower = getMaxPower();
    let newConvertedPower = convertPowerFromDIN(newPower, 'DIN hp (SI)');
    $('#newPower').val(newPower);
    $('#newPowerHp').val(newConvertedPower);

    let btnObj = $('#newInputPower').siblings('div.input-group-btn').find('button');
    newConvertedPower = convertPowerFromDIN(newPower, $(btnObj).val());
    $('#newInputPower').val(newConvertedPower);

    let oldSize = floatValue($('#comparisonSize').val());
    let newSize = Math.floor(oldSize * 1.25);
    $('#newSize').val(newSize);

    calculate();
  });
  
  $('.dropdown-item').click(function() {
    let btnObj = $(this).parent().siblings('button');
    $(btnObj).text($(this).text());
    $(btnObj).val($(this).text());

    let input = $(btnObj).parent().siblings('input');
    calculatePower(input);
    calculate();
  });

  $('.input-power').change(function() {
    calculatePower(this);
  });

  $('.input-power').keyup(function() {
    calculatePower(this);
  });

  $('.input-size').keyup(function() {
    calculateSize(this);
  });

  $('.input-weight').keyup(function() {
    calculateWeight(this);
  });

  $('input').change(function() {
    calculate();
  });

  $('#precision').text(precision);
  $('#siHorsePower').text(formatFloatValue(siHorsePower));
  $('#uscHorsePower').text(formatFloatValue(uscHorsePower));
  $('#maxbutton').click();
  calculate();
}
