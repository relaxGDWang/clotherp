var vu=new Vue({
    el: '#app',
    data:{
        listType: 'doing',
        tableHeight: 100,
        tableHeight2: 100,
        nowEdit:'',
        tableData3: [{
            id: 1,
            identifier: 'G01-01',
            batch: '10200301',
            customer: '老李',
            orderlen:'10.4',
            store:'G01-03',
            len:'100',
            type:'客户订单'
        },{
            id: 2,
            identifier: 'G01-01',
            batch: '10200301',
            customer: '老李',
            orderlen:'14.5',
            store:'G01-03',
            len:'100',
            type:'客户订单'
        },{
            id: 3,
            identifier: 'G01-01',
            batch: '10200301',
            customer: '--',
            orderlen:'0.4',
            store:'G01-03',
            len:'100',
            type:'废弃'
        },{
            id: 4,
            identifier: 'G01-01',
            batch: '10200301',
            customer: '王总',
            orderlen:'16.2',
            store:'G01-03',
            len:'100',
            type:'客户订单'
        },{
            id: 5,
            identifier: 'G01-01',
            batch: '10200301',
            customer: '--',
            orderlen:'18.4',
            store:'G01-03',
            len:'100',
            type:'分裁'
        }],
        tableData2:[{
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
        }],
        tableData1:[{
            id:1,
            who:'小杨',
            datetime:'2018-12-03 12:33',
            do:'裁剪20米',
            order:'1029348813'
        },{
            id:2,
            who:'老胡',
            datetime:'2018-12-01 14:33',
            do:'裁剪16.7米',
            order:'1029348813'
        },{
            id:3,
            who:'小杨',
            datetime:'2018-11-29 09:45',
            do:'裁剪20米',
            order:'1029348811'
        }]
    },
    methods:{
        openDetails: function(index){
            this.nowEdit=index;
            dialog.open('opDetails');
        },
        tableRowClassName: function({row, rowIndex}){
            if (row.id===this.nowEdit){
                return 'sel';
            }else{
                return '';
            }
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
    url: PATH.missionCut,
    type: 'get',
    contentType: CFG.JDTYPE,
    formater: CFG.ajaxFormater,
    checker: CFG.ajaxReturnDo
});

$(function(){
    vu.tableHeight=$('body').height()-70;
    vu.tableHeight2=vu.tableHeight+50;
    var timeID;
    $(window).resize(function(){
        if (timeID){
            clearTimeout(timeID);
            timeID='';
        }
        timeID=setTimeout(function(){
            vu.tableHeight=$('body').height()-70;
            vu.tableHeight2=vu.tableHeight+50;
        },100);
    });

    vu.getList();
});
