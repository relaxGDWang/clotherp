var vu=new Vue({
    el: '#app',
    data:{
        listType: 'doing',
        tableHeight: 100,
        editID: '',
        flagEditLen: false,
        tableData3: [{
            identifier: 'G01-01',
            batch: '10200301',
            tagLen: '100米',
            checkLen:'--',
            typeStr:'胚布',
            status:'待检验',
            store:'1号仓库',
            supply:'VIVA',
            classStr:'提花'
        }, {
            identifier: 'G01-01',
            batch: '10200302',
            tagLen: '100米',
            checkLen:'--',
            typeStr:'胚布',
            status:'待检验',
            store:'1号仓库',
            supply:'VIVA',
            classStr:'提花'
        }, {
            identifier: 'G01-02',
            batch: '10200401',
            tagLen: '120米',
            checkLen:'--',
            typeStr:'已水洗',
            status:'待检验',
            store:'2号仓库',
            supply:'宏光m',
            classStr:'提花'
        }, {
            identifier: 'G01-02',
            batch: '10200402',
            tagLen: '120米',
            checkLen:'--',
            typeStr:'已水洗',
            status:'待检验',
            store:'2号仓库',
            supply:'宏光m',
            classStr:'提花'
        }, {
            identifier: 'G01-04',
            batch: '10211301',
            tagLen: '100米',
            checkLen:'--',
            typeStr:'已复合',
            status:'待检验',
            store:'2号仓库',
            supply:'Hello',
            classStr:'提花'
        }, {
            identifier: 'G01-04',
            batch: '10211302',
            tagLen: '100米',
            checkLen:'--',
            typeStr:'已复合',
            status:'待检验',
            store:'2号仓库',
            supply:'Hello',
            classStr:'提花'
        }],
        tableData2:[{  //疵点列表
            id:1,
            start:12.6,
            end:12.8,
            type:''
        },{
            id:2,
            start:29,
            end:29.5,
            type:''
        },{
            id:3,
            start:31.2,
            end:31.3,
            type:''
        },{
            id:4,
            start:42.3,
            end:43.3,
            type:''
        }]
    },
    computed:{
      getEditobj: function(){
          if (this.editID!==''){
              return this.tableData3[this.editID];
          }else{
              return ''
          }
      }
    },
    methods:{
        tableRowClassName: function(index){
            if (index===this.editID){
                return 'sel';
            }else{
                return '';
            }
        },
        showDetials: function(index){
            this.editID=index;
            dialog.open('checkMission');
        },
        getList: function(){
            ajax.send({
                data:{v:Math.random()},
                success:function(data){
                    alert(data);
                }
            });
        }
    }
});

var dialog=relaxDialog();
var ajax=relaxAJAX({
    url: PATH.missionCheck,
    type: 'get',
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo
});

$(function(){
    var H=$('body').height();
    vu.tableHeight=H-70;
    var timeID;
    var domBottom=$('.bottomPart').eq(0);
    domBottom.height(H-385);
    $(window).resize(function(){
        if (timeID){
            clearTimeout(timeID);
            timeID='';
        }
        timeID=setTimeout(function(){
            vu.tableHeight=$('body').height()-70;
            domBottom.height(H-385);
        },100);
    });

    //vu.getList();
});