function capitalise(text) {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

function labelise(text) {
    var split = text.split('_');
    var result = "";
    for (var i = 0; i < split.length; i++) {
        split[i] = capitalise(split[i]);
    }
    return split.join(' ');
}

function add_file(target_id, index, group_ids) {
    var target = document.getElementById(target_id);
    var source = $("input[name='source']:checked").val() == 'nfs';
    var num_files = $("select#pre_process").find(':selected').attr("required_files"); // number of files requested by pre_process
    var builder = new FileFormBuilder(group_ids, source, num_files);
    target.appendChild(builder.build(index));
    $('#jstree_loader_' + index).trigger('load');
}

function FormBuilder() {
    if (typeof FormBuilder.instance === 'object') {
        return FormBuilder.instance;
    }

    Closeable.call(this);

    FormBuilder.instance = this;
    this.index = 0;
}

FormBuilder.prototype = Object.create(Closeable.prototype);

FormBuilder.prototype.build_wrapper = function() {
        var d = document.createElement('div');
        d.className = "field_div";
        return d;
    }

FormBuilder.prototype.build_label = function(txt, object, field) {
        var l = document.createElement('label');
        l.htmlFor = field + "_" + this.index;
        l.id = object + "_" + field + "__label_" + this.index;
        l.innerText = txt + ":";
        return l;
    }

FormBuilder.prototype.build_input = function(id, className, name, input_type, set_type, required, placeholder) {
        var i = document.createElement('input');
        i.id = set_type + "_" + id + "_" + this.index;
        i.className = "form-control " + className;
        i.type = input_type;
        i.name = set_type + "[" + this.index + "][" + name + "]";

        if (typeof required !== "undefined") {
            i.required = required;
        }

        if (typeof placeholder !== "undefined") {
            i.placeholder = placeholder;
        }

        return i;
    }

FormBuilder.prototype.build_field = function(id, name, label, required, placeholder) {
        if (typeof name === "undefined") {
            name = id;
        }

        if (typeof label === "undefined") {
            label = labelise(id);
        }

        var d = this.build_wrapper();
        d.appendChild(this.build_label(label, this.type, id));
        d.appendChild(this.build_input(id, 'string', name, 'text', this.type, required, placeholder));
        return d;
    }

FormBuilder.prototype.build_textarea = function(id, className, name, set_type) {
        var t = document.createElement('textarea');
        t.id = set_type + "_" + id + "_" + this.index;
        t.className = "form-control " + className;
        t.name = set_type + "[" + this.index + "][" + name + "]";
        t.rows = 1;
        return t;
    }

FormBuilder.prototype.build_fieldset = function(type) {
        var f = document.createElement('fieldset');
        f.name = type + this.index;
        f.appendChild(this.build_legend(capitalise(type) + " " + (this.index+1)));
        return f;
    }

FormBuilder.prototype.build_legend = function(text) {
        var l = document.createElement('legend');
        l.innerText = text;
        return l;
    }

FormBuilder.prototype.build_date = function(id, object, name, label) {
        if (typeof name === "undefined") {
            name = id;
        }

        if (typeof label === "undefined") {
            label = labelise(id);
        }

        var d = this.build_wrapper();
        d.appendChild(this.build_label(label, object, id));
        var i = this.build_input(id, 'date', name, 'text', object, false, 'yyyy-mm-dd');
        i.pattern = "(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))";
        i.title = "yyyy-mm-dd"
        d.appendChild(i);
        return d;
    }

function SetFormBuilder() {
    this.type = 'foobar';
    FormBuilder.call(this);
}

SetFormBuilder.prototype = Object.create(FormBuilder.prototype);

SetFormBuilder.prototype.set_id = function() {
        var id = 'id_label';
        return this.build_field(id, id, capitalise(this.type)+' ID');
    };

SetFormBuilder.prototype.build_info = function() {
        var d = this.build_wrapper();
        var id = 'info';
        d.appendChild(this.build_label('Info', this.type, id));

        var txt = this.build_textarea('info', "text", 'info', this.type);
        $(txt).data('needs-atwho', true);
        $(txt).on('focus', function() {
            $(this).data('keys', [$('#group_select option:selected').val()]);
            new VidjilAutoComplete().setupTags(this);
        });
        d.appendChild(txt);
        return d;
    };

SetFormBuilder.prototype.build_date = function(id, name, label) {
        return Object.getPrototypeOf(SetFormBuilder.prototype).build_date.call(this, id, this.type, name, label);
    }

function PatientFormBuilder() {
    SetFormBuilder.call(this);
    this.type = 'patient'
}

PatientFormBuilder.prototype = Object.create(SetFormBuilder.prototype);

PatientFormBuilder.prototype.build = function(index) {
        this.index = index;
        var fieldset = this.build_fieldset(this.type);
        fieldset.appendChild(this.createCloseButton());
        fieldset.appendChild(this.build_input('id', 'text', 'id', 'hidden', this.type));
        fieldset.appendChild(this.build_input('sample_set_id', 'text', 'sample_set_id', 'hidden', this.type));
        fieldset.appendChild(this.set_id());
        fieldset.appendChild(this.build_field('first_name', undefined, undefined, true));
        fieldset.appendChild(this.build_field('last_name', undefined, undefined, true));
        fieldset.appendChild(this.build_date('birth'));
        fieldset.appendChild(this.build_info());
        return fieldset;
    };

function RunFormBuilder() {
    SetFormBuilder.call(this);
    this.type = 'run';
}

RunFormBuilder.prototype = Object.create(SetFormBuilder.prototype);

RunFormBuilder.prototype.build = function(index) {
        this.index = index;
        var fieldset = this.build_fieldset(this.type);
        fieldset.appendChild(this.createCloseButton());
        fieldset.appendChild(this.build_input('id', 'text', 'id', 'hidden', this.type));
        fieldset.appendChild(this.build_input('sample_set_id', 'text', 'sample_set_id', 'hidden', this.type));
        fieldset.appendChild(this.set_id());
        fieldset.appendChild(this.build_field('name', undefined, undefined, true));
        fieldset.appendChild(this.build_date('run_date', 'run_date', 'Date'));
        fieldset.appendChild(this.build_info());
        fieldset.appendChild(this.build_field('sequencer'));
        fieldset.appendChild(this.build_field('pcr', 'pcr', 'PCR'));
        return fieldset;
    };

function GenericFormBuilder() {
    SetFormBuilder.call(this);
    this.type = 'generic';
}

GenericFormBuilder.prototype = Object.create(SetFormBuilder.prototype);

GenericFormBuilder.prototype.build = function(index) {
        this.index = index;
        var fieldset = this.build_fieldset('set');
        fieldset.appendChild(this.createCloseButton());
        fieldset.appendChild(this.build_input('id', 'text', 'id', 'hidden', this.type));
        fieldset.appendChild(this.build_input('sample_set_id', 'text', 'sample_set_id', 'hidden', this.type));
        fieldset.appendChild(this.build_field('name', undefined, undefined, true));
        fieldset.appendChild(this.build_info());
        return fieldset;
    }

function FileFormBuilder(group_ids, source, num_files) {
    FormBuilder.call(this);
    this.group_ids = group_ids;
    this.source = source;
    this.num_files = num_files;

}

FileFormBuilder.prototype = Object.create(FormBuilder.prototype);

FileFormBuilder.prototype.build = function(index) {
    this.index = index;
    var fieldset = this.build_fieldset('sample');
    fieldset.appendChild(this.createCloseButton());
    fieldset.appendChild(this.build_hidden_fields());
    fieldset.appendChild(this.build_file_fieldset());
    fieldset.appendChild(this.build_set_fieldset());
    fieldset.appendChild(this.build_info_fieldset());
    return fieldset;
}

FileFormBuilder.prototype.build_file_fieldset = function() {
    var self = this;
    var hide_second = this.source || this.num_files < 2;
    var f = document.createElement('fieldset');
    f.appendChild(this.build_legend('sequence file(s)'));
    var file1 = this.build_file_field(1, this.source);
    var file_input = file1.getElementsByTagName('input')[0];
    file_input.onchange = function() {
        db.upload_file_onChange('file_filename_' + self.index, this.value);
    }
    f.appendChild(file1);
    f.appendChild(this.build_file_field(2, hide_second));
    f.appendChild(this.build_jstree(!this.source));
    return f;
}

FileFormBuilder.prototype.build_hidden_fields = function() {
    var d = document.createElement('div');
    var i = this.build_input('filename', 'filename', 'filename', 'text', 'file');
    i.hidden = true;
    i.className = '';
    d.appendChild(i);
    i = this.build_input('id', '', 'id', 'text', 'file');
    i.hidden = true;
    i.className = '';
    d.appendChild(i);
    return d;
}

FileFormBuilder.prototype.build_set_fieldset = function() {
    var self = this;
    var f = document.createElement('fieldset');
    f.appendChild(this.build_legend('set selection'));
    var txt = document.createElement('div');
    txt.innerHTML = "You must associate this sample with at least one patient, run or set.<br>You can also associate it with any combination of the three.";
    f.appendChild(txt);

    f.appendChild(this.build_label('sets', 'file', 'set_ids'));

    var d = document.createElement('div');
    d.className = "token_div form-control";
    d.onclick = function() {
        $('#token_input_' + self.index).focus();
    };
    f.appendChild(d);

    var i = this.build_input('set_list', '', 'set_ids', 'text', 'file');
    i.hidden = true;
    i.className = '';
    d.appendChild(i);

    var set_div = document.createElement('div');
    set_div.id = "set_div_" + this.index;
    set_div.className = "token_container";
    d.appendChild(set_div);

    var i2 = document.createElement('input');
    i2.type = 'text';
    i2.id = 'token_input_' + this.index;
    i2.className = 'token_input';
    i2.autocomplete = "off";
    i2.onfocus = function() {
        new VidjilAutoComplete().setupSamples(this);
        new Tokeniser().setup(this, document.getElementById('set_div_' + self.index), document.getElementById('file_set_list_' + self.index));
    }
    i2.dataset.needsAtwho = true;
    i2.dataset.needsTokeniser = true;
    i2.dataset.groupIds = "[" + this.group_ids + "]";
    i2.dataset.keys = '["generic", "patient", "run"]';
    d.appendChild(i2);

    return f;
}

FileFormBuilder.prototype.build_info_fieldset = function() {
    var f = document.createElement('fieldset');
    f.appendChild(this.build_legend('sample information'));
    f.appendChild(this.build_date('sampling_date', 'file'));
    f.appendChild(this.build_info('file'));
    return f;
}

FileFormBuilder.prototype.build_file_field = function(id, hidden) {
    var d = this.build_wrapper();
    d.className += " file_" + id;
    if (this.source || hidden) {
        d.hidden = true;
    }
    d.appendChild(this.build_label('file ' + id, 'file', 'file'));
    var i = this.build_input('upload_' + id, 'upload_field', 'file'+id, 'file', 'file');
    if (this.source) {
        i.disabled = true;
    }
    d.appendChild(i);
    var s = document.createElement('span');
    s.innerText = "* (.fa, .fastq, .fa.gz, .fastq.gz, .clntab)";
    d.appendChild(s);
    return d;
}

FileFormBuilder.prototype.build_jstree = function() {
    var self = this;
    var d = this.build_wrapper();
    d.className += " jstree_container";
    if (!this.source) {
        d.hidden = true;
    }

    var sel = document.createTextNode('selected');
    d.appendChild(sel);
    var indicator = document.createElement('div');
    indicator.id = "file_indicator_" + self.index;
    d.appendChild(indicator);
    var tree_par = document.createElement('div');
    tree_par.id = "jstree_loader_" + self.index;
    tree_par.className = "jstree";
    tree_par.onload = function() {db.set_jstree($('#jstree_' + self.index), self.index)};
    tree_par.appendChild(document.createTextNode('file'));
    d.appendChild(tree_par);
    var tree = document.createElement('div');
    tree.id = 'jstree_' + this.index;
    tree.dataset.index = this.index;
    tree_par.appendChild(tree);
    return d;
}

FileFormBuilder.prototype.build_info = function(object) {
        var self = this;
        var d = this.build_wrapper();
        var id = 'info';
        d.appendChild(this.build_label('Info', object, id));

        var txt = this.build_textarea('info', "text", 'info', object);
        $(txt).data('needs-atwho', true);
        $(txt).on('focus', function() {
            $(this).data('keys', self.group_ids);
            new VidjilAutoComplete().setupTags(this);
        });
        d.appendChild(txt);
        return d;
    }
