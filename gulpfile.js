//by relax 当前wedot业务的页面编译
//version 2018-10-31
const gulp=require('gulp');
const del=require('del');
const useref=require('gulp-useref');
const uglify=require('gulp-uglify');
const cleanCSS=require('gulp-clean-css');
const imagemin=require('gulp-imagemin');
//var watch=require('gulp-watch');
const rename = require('gulp-rename');
const revContent = require('gulp-rev');
const revCollector = require('gulp-rev-collector');
//var notify = require('gulp-notify');
//var htmlreplace = require('gulp-html-replace');
//var replace = require('gulp-replace');
const htmlmin = require('gulp-htmlmin');
//var livereload = require('gulp-livereload');
//var minifyHTML   = require('gulp-minify-html');
const gulpif=require('gulp-if');
const loadJsonFile = require('load-json-file');
const gutil=require('gulp-util');

var business='';
//var business='protocol/';
//var business='background/';
var docIn='';
var docOut='dht-vue/';
var inPath=docIn+business;
var outPath=docOut+business;
var manifest=docOut+'verlink/';

gulp.task('moveStatic', function(){  //转移静态资源,包括图片，字体文件，音频媒体
	gulp.src(docIn+'library/style/fonts/*/*.+(eot|svg|ttf|woff|eot)')  //字体转移
		.pipe(gulp.dest(docOut+'library/style/fonts/'));
	
	gulp.src(docIn+'library/style/images/*.+(png|jpg|gif)')   //图片转移
		.pipe(imagemin())
		.pipe(gulp.dest(docOut+'library/style/images/'));
});

//-----------------------------------------------------

gulp.task('output', function() {
	gulp.src(inPath+'+(404|login|main|missionCheck|missionCut).html')
	//gulp.src(inPath+'login.html')
		.pipe(useref())
		.pipe(gulpif('*.js', uglify()))
		.on('error', function (err) {
			gutil.log(gutil.colors.red('[Error]'), err.toString());
		})
		.pipe(gulpif('*.css', cleanCSS()))
		.pipe(gulp.dest(outPath));
});

gulp.task('fitver', function(){
	//替换公共库
	gulp.src(docOut+'library/**/!(*-*).{css,js}')
		.pipe(revContent())
		.pipe(gulp.dest(docOut+'library'))
		.pipe(revContent.manifest('publicManifest.json'))
		.pipe(gulp.dest(manifest));
	//替换业务库
	gulp.src([outPath+'script/!(*-*).js',outPath+'style/!(*-*).css'],{base:outPath})
		.pipe(revContent())
		.pipe(gulp.dest(outPath))
		.pipe(revContent.manifest(business.replace('\/','')+'Manifest.json'))
		.pipe(gulp.dest(manifest));
});

gulp.task('rwhtml',function(){
	//协调当前文件路径
	gulp.src([manifest+'*.json',outPath+'*.html'])
		.pipe(revCollector({
				replaceReved: false,
				dirReplacements: {
						//'css': '/dist/css',
						//'js/': 'test/'
						//'cdn/': function(manifest_value) {
						//return '//cdn' + (Math.floor(Math.random() * 9) + 1) + '.' + 'exsample.dot' + '/img/' + manifest_value;
						//}
				}
		}))
		.pipe(htmlmin({collapseWhitespace:true}))
		.pipe(gulp.dest(outPath));
});

gulp.task('delver',function(){ //清空版本相关文件
	del([docOut+'library/**/*-*.{css,js}',outPath+'script/*-*.js',outPath+'style/*-*.css',manifest+'*.json']).then(paths => {
    console.log('Deleted ver files : ', paths.join('\n'));
	});
});

gulp.task('cleanver',function(){  //清除不使用的版本文件
	loadJsonFile(manifest+business.replace('\/','')+'Manifest.json').then(json => {  //删除业务文件无用版本
		var list={};
    for (let x in json){
			let nowPath=x.replace(/[^\/\.]+\.[a-zA-Z]+/,'');
			let filetype=x.replace(nowPath,'').replace(/[^\.]+\./,'');
			let filename=json[x].replace(nowPath,'').replace('.'+filetype,'');
			
			if (!list[filetype]){
				list[filetype]=[];
			}
			list[filetype].push(filename);
		}
		for (let x in list){
			let doc;
			x==='css'? doc='style/': doc='script/';
			let delString=outPath+doc+getIgString(x,list[x]);
			console.log(delString+'\n');
			del([delString]).then(paths=>{
				console.log('Deleted business version files : ', paths.join('\n'));
			});
		}
	});

	loadJsonFile(manifest+'publicManifest.json').then(json => {  //删除公共文件无用版本
		var list={};
    for (let x in json){
			let nowPath=x.replace(/[^\/\.]+\.[a-zA-Z]+/,'');
			let filetype=x.replace(nowPath,'').replace(/[^\.]+\./,'');
			let filename=json[x].replace(nowPath,'').replace('.'+filetype,'');
			
			if (!list[filetype]){
				list[filetype]=[];
			}
			list[filetype].push(filename);
		}
		for (let x in list){
			let doc;
			x==='css'? doc='css/': doc='js/';
			let delString=docOut+'library/'+doc+getIgString(x,list[x]);
			console.log(delString+'\n');
			del([delString]).then(paths=>{
				console.log('Deleted library version files : ', paths.join('\n'));
			});
		}
	});
	
	function getIgString(typeStr,nowArray){
		var tempStr='';
		for (let i=0; i<nowArray.length; i++){
			let tempName=nowArray[i].replace(/\-\w+/,'');
			tempStr+=nowArray[i]+'|'+tempName+'|';
		}
		tempStr=tempStr.replace(/\|$/,'');
		return '!('+tempStr+').'+typeStr;
	}
});
//================================================
gulp.task('relax',function(){
	return gulp.src('gulptest/index.html')
		.pipe(useref())
		.pipe(gulpif('*.js', uglify()))
		.pipe(gulpif('*.css', cleanCSS()))
		.pipe(gulp.dest('gulptest/dist/'))
});

gulp.task('relaxver',['relax'],function(){
	//替换公共库
	gulp.src('gulptest/dist/!(*-*).{css,js}')
		.pipe(revContent())
		.pipe(gulp.dest('gulptest/dist/'))
		.pipe(revContent.manifest('setting.json'))
		.pipe(gulp.dest('gulptest/config/'));
});
gulp.task('relaxrw',['relaxver'],function(){
	gulp.src(['gulptest/config/*.json','gulptest/dist/index.html'])
		.pipe(revCollector({
			replaceReved: false,
			dirReplacements: {
					//'css': '/dist/css',
					//'js/': 'test/'
					//'cdn/': function(manifest_value) {
					//return '//cdn' + (Math.floor(Math.random() * 9) + 1) + '.' + 'exsample.dot' + '/img/' + manifest_value;
					//}
			}
		}))
		.pipe(htmlmin({collapseWhitespace:true}))
		.pipe(gulp.dest('gulptest/dist/'));
});
