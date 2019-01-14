//语言包对象
//script标签调用的时候，可以设置GET参数path，path的值表明在config PATH.lang指定的总目录下的路径，值请用encodeURIComponent进行编码
//path传参的时候不需要在其结尾加/，也不需要在开头加/
//modify by relax 2018-10-31 由于gulp的useref的限制，无法把开发环境中带参数引用的script编译到上传环境中，参数会丢失，所以目前针对language.js采用包含文件的meta头来引用，例如<meta name="language" content="文件夹路径，注意转移斜杠符号">
//modify by relax 2018-11-07 不再用cookie缓存语言包，直接通过meta头获取
//
window.LG = (function () {
    //var parameter=document.currentScript.src.match(/[\?|&]path=[^&$]+/);
    var parameter = $('meta[name="language"]').attr('content');
    var nowpath = '';
    if (parameter) {
        nowpath = decodeURIComponent(parameter) + '/';
    }
    var language = {};
    var locale = '';
    var version = 14;
    var domain = location.host.replace(/^www\./, '');
    /*
    function _saveLocale(){
        setCookie('locale',locale,365*24*60*60,domain);
    }
    */
    locale = getUrlQuery('language'); // || getCookie('locale');  //modify by relax 2018-11-06 增加了强制转换的方法，应对测试
    if (!locale) {
        //modify by relax 2018-11-09 because the browers navigator.language navigator.languages
        var tempLang;
        if (navigator.languages!==undefined && navigator.languages+'') {  //modify by relax 2018-11-20 在PC端微信浏览器，该字段值为空对象  //modify by relax 2018-12-3 在某些手机微信端反馈的navigator.languages为undefined
            navigator.languages instanceof Array ? tempLang = navigator.languages[0] : tempLang = navigator.languages;
        } else {
            tempLang = navigator.language;
        }
        if (/^zh(-\w+)?$/.test(tempLang)) {
            locale = CFG.cn;
        } else {
            locale = CFG.en;
        }
        //_saveLocale();
    }
    //按语言对html代码做调整协调
    $('html').attr('lang', locale);
    $('body').each(function () {
        var nowClassName = this.className;
        nowClassName = nowClassName.replace(/([^|\s]([a-zA-Z]{2})([\-_][a-zA-Z]{2})?)([\s|$])/g, '$1' + locale + '$3');
        if (this.className === nowClassName) {
            $(this).addClass(locale);
        } else {
            this.className = nowClassName;
        }
    });
    //加载语言包
    var loader = relaxAJAX({
        contentType: 'form',
        url: PATH.lang + nowpath + locale + '.json?ver=' + version,
        type: 'GET',
        async: false,
        error: function (code, msg) {
            throw 'Language package loaded error! ' + code + ' ' + msg;
        },
        success: function (data) {
            $.extend(language, data);
        }
    });
    loader.send();
    return {
        msg: language[locale],
        locale: locale,
        change: function (newLocale) {
            if (!newLocale) return;
            locale = newLocale;
            //_saveLocale();
            location.href = '';
        }
    };
})();
