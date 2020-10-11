var pairsJson =
{
  "ar": {"language": "lang_arabic", "targets": ["de", "en", "es", "fr", "he", "it", "pt", "ru", "tr"]},
  "de": {"language": "lang_german", "targets": ["ar", "en", "es", "fr", "he", "it", "ja", "nl", "pl", "pt", "ro", "ru", "tr"]},
  "en": {"language": "lang_english", "targets": ["ar", "de", "es", "fr", "he", "it", "ja", "nl", "pl", "pt", "ro", "ru", "tr", "zh"]},
  "es": {"language": "lang_spanish", "targets": ["ar", "de", "en", "fr", "he", "it", "ja", "nl", "pl", "pt", "ro", "ru", "tr", "zh"]},
  "fr": {"language": "lang_french", "targets": ["ar", "de", "en", "es", "he", "it", "ja", "nl", "pl", "pt", "ro", "ru", "tr", "zh"]},
  "he": {"language": "lang_hebrew", "targets":  ["ar", "de", "en", "es", "fr", "it", "nl", "pt", "ru"]},
  "it": {"language": "lang_italian", "targets": ["ar", "de", "en", "es", "fr", "he", "ja", "nl", "pl", "pt", "ro", "ru", "tr"]},
  "ja": {"language": "lang_japanese", "targets": ["de", "en", "es", "fr", "it", "pt", "ru"]},
  "nl": {"language": "lang_dutch", "targets":  ["de", "en", "es", "fr", "he", "it", "pt", "ru"]},
  "pl": {"language": "lang_polish", "targets":  ["de", "en", "es", "fr", "it"]},
  "pt": {"language": "lang_portuguese", "targets": ["ar", "de", "en", "es", "fr", "he", "it", "ja", "nl", "ru", "tr"]},
  "ro": {"language": "lang_romanian", "targets":  ["de", "en", "es", "fr", "it", "tr"]},
  "ru": {"language": "lang_russian", "targets": ["ar", "de", "en", "es", "fr", "he", "it", "ja", "nl", "pt"]},
  "tr": {"language": "lang_turkish", "targets":  ["ar", "de", "en", "es", "fr", "it", "pt", "ro"]},
  "zh": {"language": "lang_chinese", "targets": ["en", "es", "fr"]}
};

var searchHistories = {};

var currentHistoryId = 0;

const maxHistoriesLength = 5;

String.defaultLocale = "en";

var lastSearchText = "";

var restoreLanguages = function() {
  let historyLength = Object.keys(searchHistories).length;
  let request = searchHistories[historyLength - 1].request;
  $("#source-lang").val(request.source_lang);
  $("#target-lang").val(request.target_lang);
}

var restoreResults = function(hisId) {
    let request = searchHistories[hisId].request,
        response = searchHistories[hisId].response;
    $('#search-text').val(request.source_text);
    $('#source-lang').val(request.source_lang);
    changedSourceLang(request.source_lang);
    $('#target-lang').val(request.target_lang);
    clearResults();
    setResults(request, response);
}

var historyForward = function() {
  currentHistoryId++;
  if (currentHistoryId < Object.keys(searchHistories).length) {
    restoreResults(currentHistoryId);
  } else {
    $('#history-forward').attr('disabled', 'disabled');
    $('#search-text').val("");
    clearResults();
    restoreLanguages();
  }
  $('#history-back').removeAttr('disabled');
}

var historyBack = function() {
  currentHistoryId--;
  if (currentHistoryId == 0) {
    $('#history-back').attr('disabled', 'disabled');
  }
  if (currentHistoryId >= 0) {
    restoreResults(currentHistoryId);
  }
  $('#history-forward').removeAttr('disabled');
}

var getIdInHistory = function(_request) {
  var idInHistory = -1;
  var historyLength = Object.keys(searchHistories).length;
  for (let i = 0; i < historyLength; i++) {
    let reqInHistory = searchHistories[i].request;
    if (_request.source_text === reqInHistory.source_text && _request.source_lang === reqInHistory.source_lang &&
        _request.target_lang === reqInHistory.target_lang) {
      idInHistory = parseInt(i);
      break;
    }
  }
  return idInHistory;
}

var saveHistory = function(request, response, idInHistory) {
  let historyLength = Object.keys(searchHistories).length;
  if (idInHistory >= 0 || historyLength >= maxHistoriesLength) {
    let i = idInHistory >= 0 ? idInHistory : 0;
    for (i; i < historyLength - 1; i++) {
      searchHistories[i] = searchHistories[i + 1];
    }
  }
  let idForNew = historyLength < maxHistoriesLength ? historyLength : maxHistoriesLength - 1;
  searchHistories[idForNew] = {request: request, response: response};
  window.localStorage.setItem("localHistories", JSON.stringify(searchHistories));
}

var clearResults = function() {
  $("#translate-result").empty();
  $("#dictionary-entries").empty();
}

var setResults = function(request, response) {
  var tResult = $("#translate-result");
  var dEntries = $("#dictionary-entries");
  response.list.forEach(result => {
    let resNode = $("<li class='mdc-list-item'></li>");
    let nodeContent = $("<span class='mdc-list-item__text'></span>")
    let sText = $("<span class='mdc-list-item__primary-text context-source'>" + result.s_text + "</span>");
    let tText = $("<span class='mdc-list-item__secondary-text context-target'>" + result.t_text + "</span>");
    nodeContent.append(sText);
    nodeContent.append(tText);
    resNode.append(nodeContent);
    tResult.append(resNode);
  });
  if (response.dictionary_entry_list && response.dictionary_entry_list.length > 0) {
    if (!request.target_text) {
      response.dictionary_entry_list.forEach(entry => {
        let entryNode = $('<div class="flex-column"></div>');
        let aLink = $('<a class="rr-button"></a>');
        aLink.append('<span>' + entry.term + '</span>');
        aLink.click(function() {
          $('#dictionary-entries a.selected').removeClass('selected');
          $(this).addClass('selected');
          let clonedReq = Object.assign({}, request);
          clonedReq.target_text = entry.term;
          apiCaller(clonedReq, false);
        });
        entryNode.append(aLink);
        dEntries.append(entryNode);
      });
    }
  }
}

var newInput = function() {
  clearResults();
  currentHistoryId = Object.keys(searchHistories).length;
  if (currentHistoryId > 0) {
    $('#history-back').removeAttr('disabled');
  }
  $('#history-forward').attr('disabled', 'disabled');
}

var newSearch = function(sourceText) {
  if (sourceText && sourceText !== "") {
    let _request = {
      source_text: sourceText,
      source_lang: $('#source-lang').val(),
      target_lang: $('#target-lang').val()
    }
    let idInHistory = getIdInHistory(_request);
    if (idInHistory < 0) {
      apiCaller(_request, true);
    } else {
      let sHistory = searchHistories[idInHistory];
      clearResults();
      setResults(sHistory.request, sHistory.response);
      saveHistory(sHistory.request, sHistory.response, idInHistory);
    }
    currentHistoryId = Object.keys(searchHistories).length - 1;
    $('#history-forward').removeAttr('disabled');
  }
}

var apiCaller = function(_request, isNew) {
  $('.loading').show();
  _request.target_text = (_request.target_text || "").trim();
  lastSearchText = _request.source_text;
  console.log("translate for key:" + _request.source_text + ", " + _request.target_text);

  var tResult = $("#translate-result");
  var dEntries = $("#dictionary-entries");
  tResult.empty();

  if (_request.target_text === "") {
    dEntries.empty();
  }

  var request = {
      "source_text": _request.source_text,
      "target_text": _request.target_text,
      "source_lang": _request.source_lang,
      "target_lang": _request.target_lang,
      "npage": 1,
      "mode": 0 };

  $.ajax({
    url: "https://context.reverso.net/bst-query-service",
    dataType: "json",
    type: "post",
    contentType: "application/json",
    data: JSON.stringify(request),
    processData: false,
    success: function(data, textStatus, jQxhr){
        if (data) {
          tResult.empty();
          if (data.list && data.list.length > 0) {
            setResults(request, data);
            if (isNew) {
              saveHistory(request, data, -1);
              $('#history-forward').removeAttr('disabled');
            }
          } else{
            let errorNode = $("<div class='error-comment'></div>")
            errorNode.text("no_result".toLocaleString());
            tResult.append(errorNode);
          }
        } else {
          console.log("Unexpected error occurred.");
          tResult.append("Unexpected error occurred.");
        }
        setTimeout(function() { $('.loading').hide(); }, 500);
    },
    error: function(jqXhr, textStatus, errorThrown){
      console.log(textStatus);
      tResult.append(textStatus);
      setTimeout(function() { $('.loading').hide(); }, 500);
    }
  });
}

var changedSourceLang = function(sLang) {
  let tLang = $('#target-lang').val();
  $('#target-lang').empty();
  $.each(pairsJson[sLang].targets, function(key, val) {
    let option = new Option(pairsJson[val].language.toLocaleString(), val);
    $('#target-lang').append($(option));
  });
  $("#target-lang option[value=" + tLang + "]").prop("selected","selected");
}

var changedTargetLang = function() {
}

var exchangeLang = function() {
  let sLang = $('#source-lang').val();
  let tLang = $('#target-lang').val();
  $('#source-lang').val(tLang);
  changedSourceLang(tLang);
  $('#target-lang').val(sLang);
}

window.onload = function() {
  console.log("window onload().");

  try {
    let sLocalHistories = window.localStorage.getItem("localHistories")
    if (sLocalHistories) {
      let localHistories = JSON.parse(sLocalHistories);
      let historyLength = Object.keys(localHistories).length;
      if (historyLength > 0) {
        searchHistories = localHistories;
        try {
          searchHistories[historyLength - 1].request;
        } catch (e) {
          let sortedIds = Object.keys(searchHistories).map(key => parseInt(key)).sort()
          historyLength = historyLength < maxHistoriesLength ? historyLength : maxHistoriesLength, i = 0;
          let fixedHistories = {};
          sortedIds.forEach(function(id) {
            if (i < maxHistoriesLength)
              fixedHistories[i++] = searchHistories[id];
          });
          searchHistories = fixedHistories;
          window.localStorage.setItem("localHistories", JSON.stringify(searchHistories));
        }
      }
    }
  } catch (e) {
    console.log(e);
  }

  $('#source-lang').empty();
  $('#target-lang').empty();
  $.each(pairsJson, function(key, val) {
    let option = new Option(val.language.toLocaleString(), key);
    $('#source-lang').append($(option));
  });

  // Restore languages from preferences.
  let historyLength = Object.keys(searchHistories).length
  let sLang = historyLength > 0 ? searchHistories[historyLength - 1].request.source_lang : "en";
  let tLang = historyLength > 0 ? searchHistories[historyLength - 1].request.target_lang : "ar";
  $.each(pairsJson[sLang].targets, function(key, val) {
    let option = new Option(pairsJson[val].language.toLocaleString(), val);
    $('#target-lang').append($(option));
  });
  $("#source-lang").val(sLang);
  $("#target-lang").val(tLang);

  $("#source-lang").on("change", function() { changedSourceLang(this.value); });
  $("#exchange-lang").on("click", exchangeLang);
  $("#target-lang").on("change", changedTargetLang);
  $("#history-back").on("click", historyBack);
  $('#search-text').on('input', newInput);
  $("#search-button").on("click", function() {
    let newText = $('#search-text').val().trim();
    $('#search-text').val(newText)
    newSearch(newText);
  });
  $("#history-forward").on("click", historyForward);

  /** Activate search-text field. **/
  $("#search-text").attr("placeholder", "search_label".toLocaleString());
  [].forEach.call(document.querySelectorAll('.mdc-text-field'), function(el) {
    mdc.textField.MDCTextField.attachTo(el);
  });

  currentHistoryId = Object.keys(searchHistories).length;
  if (currentHistoryId > 0) {
    $('#history-back').removeAttr('disabled');
  }
  $('.loading').hide();
}

window.addEventListener("message", function(data) {
  var searchObj = JSON.parse(data.data);
  if (true || lastSearchText !== searchObj.sourceText) {
    newInput();
    $("#search-text").val(searchObj.sourceText);
    newSearch(searchObj.sourceText);
  }
});
