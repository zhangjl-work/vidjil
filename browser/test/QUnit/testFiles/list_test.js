
QUnit.module("List", {
});

QUnit.test("edit", function(assert) {

    assert.expect(2)
    var ready = assert.async()

    var m = new Model();
    m.parseJsonData(json_data,100)
    m.loadGermline()
    m.initClones()
    

    var list = new List("list","data",m);
    list.init();
    
    var clone_list = document.getElementById('list').lastChild
    assert.equal(clone_list.childNodes.length, 7, "clone list length = 7 -> 5 clones+ 2 others (TRG & IGH) : Ok")


    list.editName(1, list.index[1])
    assert.notEqual(list.index[1].innerHTML.indexOf("save"), -1, "open edit clone name : Ok")
    
    setTimeout( function() {
        $("#new_name").val("editName");
    }, 100)
    setTimeout( function() {
        var e = $.Event('keydown');
        e.which = 13; // enter
        e.keyCode = 13; // enter
        $("#new_name").trigger(e);
        //TODO
        //equal(list.index[1].innerHTML, -1, "edited clone name : Ok")
        ready()
    }, 150)
    
    
});

QUnit.test("sort", function(assert) {
    
    var m = new Model();
    m.parseJsonData(json_data,100)
    m.loadGermline()
    m.initClones()
    m.changeTime(3)
    
    var list = new List("list","data",m);
    list.init();
    
    var clone_list = document.getElementById('list').lastChild.childNodes
    
    list.sortListBy(function(id){return m.clone(id).getSize()});
    assert.notEqual(clone_list[0].innerHTML.indexOf("IGH smaller"), -1, "sortBySize: Ok");
    assert.notEqual(clone_list[1].innerHTML.indexOf("TRG smaller"), -1, "sortBySize: Ok");
    assert.notEqual(clone_list[2].innerHTML.indexOf("test1"),       -1, "sortBySize: Ok");
    assert.notEqual(clone_list[3].innerHTML.indexOf("test2"),       -1, "sortBySize: Ok");
    assert.notEqual(clone_list[4].innerHTML.indexOf("test4"),       -1, "sortBySize: Ok");
    assert.notEqual(clone_list[5].innerHTML.indexOf("unseg sequence"), -1, "sortBySize: Ok");
    assert.notEqual(clone_list[6].innerHTML.indexOf("test3"),       -1, "sortBySize: Ok");

    list.sortListByV();
    assert.notEqual(clone_list[0].innerHTML.indexOf("test3"),       -1, "sortByV: Ok");

    assert.notEqual(clone_list[1].innerHTML.indexOf("unseg sequence"), -1, "sortByV: Ok");
    assert.notEqual(clone_list[2].innerHTML.indexOf("IGH smaller"), -1, "sortByV: Ok");
    // test1 and test4 both have the same V
    assert.ok(clone_list[3].innerHTML.indexOf("test1") != -1
             || clone_list[3].innerHTML.indexOf("test4") != -1, "sortByV: Ok");
    assert.ok(clone_list[4].innerHTML.indexOf("test1") != -1
             || clone_list[4].innerHTML.indexOf("test4") != -1, "sortByV: Ok");
    assert.notEqual(clone_list[5].innerHTML.indexOf("test2"),       -1, "sortByV: Ok");
    assert.notEqual(clone_list[6].innerHTML.indexOf("TRG smaller"), -1, "sortByV: Ok");

    list.sortListByJ();
    assert.notEqual(clone_list[0].innerHTML.indexOf("test3"),       -1, "sortByJ: Ok");
    assert.notEqual(clone_list[1].innerHTML.indexOf("unseg sequence"), -1, "sortByJ: Ok");
    assert.notEqual(clone_list[2].innerHTML.indexOf("IGH smaller"), -1, "sortByJ: Ok");
    // test2 and test4 both have the same J
    assert.ok(clone_list[3].innerHTML.indexOf("test2") != -1
             || clone_list[3].innerHTML.indexOf("test4") != -1, "sortByJ: Ok");
    assert.ok(clone_list[4].innerHTML.indexOf("test2") != -1
             || clone_list[4].innerHTML.indexOf("test4") != -1, "sortByJ: Ok");
    assert.notEqual(clone_list[5].innerHTML.indexOf("test1"),       -1, "sortByJ: Ok");
    assert.notEqual(clone_list[6].innerHTML.indexOf("TRG smaller"), -1, "sortByJ: Ok");

    list.sortListBy(function(id){return -m.clone(id).top});
    assert.notEqual(clone_list[0].innerHTML.indexOf("smaller"), -1, "sortByTop: Ok"); // TRG or IGH
    assert.notEqual(clone_list[1].innerHTML.indexOf("smaller"), -1, "sortByTop: Ok"); // TRG or IGH
    assert.notEqual(clone_list[2].innerHTML.indexOf("test1"),       -1, "sortByTop: Ok");
    assert.notEqual(clone_list[3].innerHTML.indexOf("test2"),       -1, "sortByTop: Ok");
    assert.notEqual(clone_list[4].innerHTML.indexOf("test3"),       -1, "sortByTop: Ok");
});

QUnit.test("filters", function(assert) {

    assert.expect(10);
    var ready = assert.async(5);
    
    var m = new Model();
    m.parseJsonData(json_data,100)
    m.loadGermline()
    m.initClones()
    
    var list = new List("list","data",m);
    list.init();

    var clone_list = document.getElementById('list').lastChild.childNodes
    m.updateElemStyle([0,1,2,3]);

    m.filter("test1");
    setTimeout( function() {
        assert.ok(  $(clone_list[4]).is(':visible'), "filter id ('test1') : test1 is visible : Ok");
        assert.ok( !$(clone_list[3]).is(':visible'), "filter id ('test1') : test2 is not visible : Ok");
        m.filter("aAaaaAAA");
        ready()
    }, 100);
    setTimeout( function() {
        assert.ok(  $(clone_list[4]).is(':visible'), "filter seq ('aAaaaAAA') : test1 is  visible : Ok");
        assert.ok( !$(clone_list[3]).is(':visible'), "filter seq ('aAaaaAAA') : test2 is not visible : Ok");
        m.filter("TGGGGGGg");
        ready()
    }, 200);
    setTimeout( function() {
        assert.ok( !$(clone_list[4]).is(':visible'), "filter revComp ('TGGGGGGg') : test1 is not visible : Ok");
        assert.ok(  $(clone_list[3]).is(':visible'), "filter revComp ('TGGGGGGg') : test2 is visible : Ok");
        m.filter("CCCCa");
        ready()
    }, 300);
    setTimeout( function() {
        assert.ok( !$(clone_list[4]).is(':visible'), "filter seq ('CCCCa') : test1 is not visible : Ok");
        assert.ok(  $(clone_list[3]).is(':visible'), "filter seq ('CCCCa') : test2 is visible : Ok");
        m.reset_filter(false);
        m.update();
        ready()
    }, 400);
    setTimeout( function() {
        assert.ok( $(clone_list[4]).is(':visible'), "reset_filter : test1 is visible : Ok");
        assert.ok( $(clone_list[3]).is(':visible'), "reset_filter : test2 is visible : Ok");
        ready()
    }, 500);

});

QUnit.test("tag/norm", function(assert) {
    var m = new Model();
    m.parseJsonData(json_data,100)
    m.loadGermline()
    m.initClones()
    
    var list = new List("list","data",m);
    list.init();
    
    var clone_list = document.getElementById('list').lastChild.childNodes
    
    assert.ok(true,"ok")
    $(clone_list[3]).find($(".starBox")).click()

    assert.equal(m.clone(1).getSize(), 0.1, "size before norm : Ok")
    assert.equal(m.clone(2).getSize(), 0.125, "size before norm : Ok")
    
    m.norm_input.value = 0.25;
    m.norm_button.click();
    
    assert.equal(m.clone(1).getSize(), 0.25, "size after norm : Ok")
    assert.equal(m.clone(2).getSize(), 0.3125, "size after norm : Ok")
});



QUnit.test("cluster", function(assert) {
    var m = new Model();
    m.parseJsonData(json_data,100)
    m.loadGermline()
    m.initClones()

    var list = new List("list","data",m);
    list.init();

    m.merge([1, 3, 4]);

    var li_clone1 = document.getElementById('1');
    var li_clone3 = document.getElementById('3');
    var li_clone4 = document.getElementById('4');

    setTimeout( function() {
        assert.ok( $(li_clone1).is(':visible'), "clone merged, but main clone should be visible");
        assert.ok( ! $(li_clone3).is(':visible'), "clone merged should not be visible");
        assert.ok( ! $(li_clone4).is(':visible'), "clone merged should not be visible");
    }, 500);

    var elements = $('[cloneid=1]');

    assert.equal( elements.length, 1, "Only one element with cloneid = '1'");

    list.showCluster(elements[0]);
    li_clone1 = document.getElementById('1');
    li_clone3 = document.getElementById('3');
    li_clone4 = document.getElementById('4');
    setTimeout( function() {
        assert.ok( $(li_clone1).is(':visible'), "clone merged, but main clone should be visible");
        assert.ok( $(li_clone3).is(':visible'), "clone merged should be visible");
        assert.ok( $(li_clone4).is(':visible'), "clone merged should be visible");
    }, 500);

    list.hideCluster(elements[0]);
    setTimeout( function() {
        assert.ok( $(li_clone1).is(':visible'), "clone merged, but main clone should be visible");
        assert.ok( ! $(li_clone3).is(':visible'), "clone merged should be visible");
        assert.ok( ! $(li_clone4).is(':visible'), "clone merged should be visible");
    }, 500);

    m.select(1);
    list.showCluster(elements[0]);
    setTimeout( function() {
        assert.ok(m.clones[1].isSelected(), "Clone 1 should be selected (main cluster)");
        assert.ok(m.clones[3].isSelected(), "Clone 3 should be selected (opened cluster)");
        assert.ok(m.clones[4].isSelected(), "Clone 4 should be selected (opened cluster)");
        assert.ok(! m.clones[2].isSelected(), "Clone 2 should not be selected (not in cluster)");
    }, 500);

    list.hideCluster(elements[0]);
    setTimeout( function() {
        assert.ok(m.clones[1].isSelected(), "Clone 1 should be selected (main cluster)");
        assert.ok(! m.clones[3].isSelected(), "Clone 3 should not be selected (closed cluster)");
        assert.ok(! m.clones[4].isSelected(), "Clone 4 should not be selected (closed cluster)");
        assert.ok(! m.clones[2].isSelected(), "Clone 2 should not be selected (not in cluster)");
    }, 500);
});
