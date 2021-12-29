window.onload=function(){
  var precision = 4;
  var siHorsePower = 0.73549875;
  var uscHorsePower = 0.7457;
  var pound = 0.45359237;
  var weight2PowerRatios = {
    1: [ 20, -12 ],
    2: [ 20, 10 ],
    3: [ 15, 7 ],
    4: [ 10, 5 ],
    5: [ 5, 4 ],
  };

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

    let oldWeight = floatValue($('#comparisonWeight').val());
    let newWeight = floatValue($('#newWeight').val());

    if (newWeight == 0) {
      newWeight = oldWeight;
      $('#newWeight').val(Math.round(newWeight));
      $('#newWeight').keyup();
    }

    let oldWeight2Power = (oldWeight / oldPower);
    let newWeight2Power;

    for (let entry in weight2PowerRatios) {
      let w2p = weight2PowerRatios[entry][0];
      let w2pmax = weight2PowerRatios[entry][1];
      if (w2pmax < 0 && oldWeight2Power > w2p) {
        newWeight2Power = w2pmax * -1;
      }
      else if (oldWeight2Power <= w2p) {
        newWeight2Power = w2pmax;
      }
    }

    let newPower = newWeight / newWeight2Power;

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
    $('#resultWeight2Power').text('');
    $('#resultPower').removeClass('bg-success bg-danger bg-warning');
    $('#resultWeight2Power').removeClass('bg-success bg-danger bg-warning');

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
      resultPowerText += '<br>Teho kasvaa yli 20 %. Muutettava vertailuajoneuvoa vastaavaksi ja sovelletaan omamassa-teho-suhdetta.';
      $('#resultPower').addClass('bg-danger');
    }
    else {
      $('#resultPower').addClass('bg-warning');
    }
    $('#resultPower').html(resultPowerText);

    let oldWeight = floatValue($('#comparisonWeight').val());
    let newWeight = floatValue($('#newWeight').val());

    if (newWeight == 0) {
      newWeight = oldWeight;
      $('#newWeight').val($('#comparisonWeight').val());
      $('#newWeight').keyup();
    }

    let oldWeight2Power = oldWeight / oldPower;
    let newWeight2Power = newWeight / newPower;

    let resultWeight2PowerText = 'Omamassan suhde tehoon ' + formatFloatValue(newWeight2Power) + ' kg/kW';

    let weight2PowerClass = 'bg-success';

    for (let entry in weight2PowerRatios) {
      let w2p = weight2PowerRatios[entry][0];
      let w2pmax = weight2PowerRatios[entry][1];
      if (w2pmax < 0 && oldWeight2Power > w2p) {
        w2pmax *= -1;
        resultWeight2PowerText = '<br>Vanha suhde ' + formatFloatValue(oldWeight2Power) + ' kg/kW<br>Vanha suhde on yli ' + w2p + ' kg/kW, uusi suhde ei saa mennä alle ' + w2pmax + ' kg/kW.';
        if (newWeight2Power < w2pmax) {
          weight2PowerClass = 'bg-danger';
        }
        else if (round(newWeight2Power) == w2pmax) {
          weight2PowerClass = 'bg-warning';
        }
        else {
          weight2PowerClass = 'bg-success';
        }
      }
      else if (oldWeight2Power <= w2p) {
        resultWeight2PowerText = '<br>Vanha suhde ' + formatFloatValue(oldWeight2Power) + ' kg/kW<br>Vanha suhde on alle ' + w2p + ' kg/kW, uusi suhde ei saa mennä alle ' + w2pmax + ' kg/kW.';
        if (newWeight2Power < w2pmax) {
          weight2PowerClass = 'bg-danger';
        }
        else if (round(newWeight2Power) == w2pmax) {
          weight2PowerClass = 'bg-warning';
        }
        else {
          weight2PowerClass = 'bg-success';
        }
      }
    }
    $('#resultWeight2Power').addClass(weight2PowerClass);

    resultWeight2PowerText = 'Omamassan suhde tehoon ' + formatFloatValue(newWeight2Power) + ' kg/kW' + resultWeight2PowerText;

    $('#resultWeight2Power').html(resultWeight2PowerText);


  }

  function calculatePower(input) {
    let btnObj = $(input).siblings('div.input-group-btn').find('button');
    let newPower = convertPowerToDIN(floatValue($(input).val()), $(btnObj).val());
    let newConvertedPower = convertPowerFromDIN(newPower, 'DIN hp (SI)');
    $(input).parent().siblings('div.input-group.kw').find('input[readonly]').val(newPower);
    $(input).parent().siblings('div.input-group.hp').find('input[readonly]').val(newConvertedPower);
  }

  function calculateWeight(input) {
    if (input.id == 'comparisonWeightLb' || input.id == 'newWeightLb') {
      let kgWeight = Math.ceil(floatValue($(input).val()) * pound);
      $(input).parent().siblings('div.input-group.kg').find('input').val(kgWeight);
    }
    else {
      let lbWeight = Math.round(floatValue($(input).val()) / pound);
      $(input).parent().siblings('div.input-group.lb').find('input').val(lbWeight);
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
  $('.kg .input-weight').keyup();
}
