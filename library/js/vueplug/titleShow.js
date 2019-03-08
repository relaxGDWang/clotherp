//utf8
//裁剪和检验页面的标题及搜索条
//外抛数据接口
//title 标题文本
//icon 标题图标
//text1 选项卡1的文本
//icon1 选项卡1的图标
//text2 选项卡2的文本
//icon2 选项卡2的图标
//username 用户名
//equipment 设备状态对象{printer,counter,neter}
//search search对象
//searchvalue  临时用，目前为过滤已完成需要传递的字符串
//外部方法
//refresh 刷新事件
//setsearch 设置查询条件
Vue.component('rex-title', {
    template: ''+
        '<div class="titleBar">' +
            '<h1 class="itemButton fa" :class="icon">{{title}}</h1>' +
            '<div class="itemButton dropItemShow fa fa-bars"><ul class="nohead"><li class="fa fa-home" @click="backHome()">返回首页</li><li class="fa fa-refresh" @click="refresh()">刷新列表</li><li class="fa fa-print" @click="printget">取货打印</li></ul></div>' +
            '<div class="itemButton fa" :class="[getClassString1,icon1]" @click="setsearch()">{{text1}}</div>' +
            '<div class="itemButton fa" :class="[getClassString2,icon2]" @click="setsearch(1)">{{text2}}</div>' +
            '<div v-if="searchvalue===\'cut\'" class="itemButton fa fa-plane" :class="[getClassString3]" @click="setsearch(2)">快速裁剪</div>' +
            '<span class="userInfo fa fa-user">{{username}}</span>' +
            '<span class="eqStatus fa fa-print" :class="equipment.printer" @click="openSetting()"></span>' +
            '<span class="eqStatus fa fa-legal" :class="equipment.counter" @click="openSetting()"></span>' +
            '<span class="eqStatus fa fa-signal" :class="equipment.neter" @click="openSetting()"></span>' +
        '</div>',
    props:{
        title:{
            required:  true
        },
        text1:{
            default: '待处理'
        },
        icon1:{
            default: 'fa-pencil-square'
        },
        text2:{
            default: '已完成'
        },
        icon2:{
            default: 'fa-check-square'
        },
        icon:{
            default: ''
        },
        username:{
            required:  true
        },
        equipment:{
            default: {}
        },
        search:{
            default: {}
        },
        searchvalue:{
            required:  true
        }
    },
    computed:{
        getClassString1: function(){
            return this.search.listType? '':'sel';
        },
        getClassString2: function(){
            return this.search.listType===this.searchvalue? 'sel':'';
        },
        getClassString3: function(){
            return this.search.listType==='quick'? 'sel':'';
        }
    },
    methods:{
        refresh: function(){
            this.$emit('refresh');
        },
        backHome: function(){
            history.back();
        },
        setsearch: function(keyValue){
            if (keyValue){
                if (keyValue===1){
                    this.$emit('setsearch',this.searchvalue);
                }else{
                    this.$emit('setsearch','quick');
                }
            }else{
                this.$emit('setsearch');
            }
        },
        printget: function(){
            this.$emit('printget');
        },
        openSetting: function(){
            //打开设备设置窗口
            if (window.EQUIPMENT) EQUIPMENT.setting();
        }
    }
});