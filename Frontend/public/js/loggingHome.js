var typingTimer;
var doneTypingInterval = 350;
var boards = [];

(function() {
    var sessionSearch = $('#session-search');

    sessionSearch.on('keyup', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(loadSessions, doneTypingInterval);
    });

    sessionSearch.on('keydown', function () {
        clearTimeout(typingTimer);
    });

    loadSessions();
    loadBoards();

    $('#session-add-interval').change(function(event) {
        var interval = event.target.value;
        if(interval<1000) {
            var samples = (1000/interval).toFixed(1);
            var time = "second";
        } else {
            var samples = (60000/interval).toFixed(1);
            var time = "minute";
        }
        $('#session-logging-speed-samples').html(samples);
        $('#session-logging-speed-time').html(time);
    });

    $('#session-add-column-board-1').change(colBoardChange);
})();

function colBoardChange(event) {
    var id = event.target.id;
    var colNo = id.substring(id.lastIndexOf('-')+1, id.length);
    updateSensors(colNo);
}

function updateBoardsHtml() {
    var noCols = $('#session-add-columns').children().length;
    for(var i=0; i<noCols; i++) {
        updateBoardHtml(i+1);
    }
}

function updateBoardHtml(col) {
    var options = '<option></option>';
    for(var i=0; i<boards.length; i++) {
        options += `
            <option data-boardId="${boards[i].id}">${boards[i].name}</option>
        `;
    }
    $('#session-add-column-board-'+col).html(options);
}

function updateSensors(colNo) {
    var boardId = $('#session-add-column-board-'+colNo).find(":selected").attr('data-boardId');
    var options = '';
    for(var i=0; i<boards.length; i++) {
        if(boards[i].id === boardId) {
            var sensors = boards[i].sensors;
            for(var j=0; j<sensors.length; j++) {
                options += `
                <option data-sensorId="${sensors[j].id}">${sensors[j].name}</option>
            `;
            }
            break;
        }
    }
    $('#session-add-column-sensor-'+colNo).html(options);
}

function loadSessions() {
    var request = {
        queryParams: {
            query: $('#session-search').val()
        }
    };

    $.ajax({
        url: '/api/db/get-user-sessions',
        type: 'POST',
        data: JSON.stringify(request),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            if(!data.success) return notify('danger', 'Error', 'Could not retrieve session data');
            var sessionsHtml = "";
            for(var i=0; i<data.sessions.length; i++) {
                sessionsHtml += `
                    <div class="col-sm-6 col-md-4">
                      <div class="card">
                        <div class="card-header">
                          <a href="/logging/${data.sessions[i].session_id}">
                            <button type="button" class="btn btn-link" >${data.sessions[i].session_name}</button>
                          </a>
                        </div>
                      </div>
                    </div>
                `
            }
            $('.logging-sessions').html(sessionsHtml);
        }
    });
}

function loadBoards() {
    $.ajax({
        url: '/api/db/get-available-sensors',
        type: 'POST',
        data: JSON.stringify({queryParams:{}}),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data) {
            if(!data.success) return notify('danger', 'Error', 'Could not retrieve board data');
            boards = data.boards;
            updateBoardsHtml();
        }
    });
}

/*
    Logging Session Add Functions
 */

function addSessionColumn() {
    var columns = $('#session-add-columns');
    var colNumber = columns.children().length+1;
    $('#session-add-col-btns').remove(); //remove add column button from previous
    columns.append(`
                  <div class="col-md-12 session-logging-column">
                    <div class="row">
                      <div class="col-md-4">
                        <div class="form-group">
                          <label for="session-add-column-name-${colNumber}">Column Name - ${colNumber}</label>
                          <input class="form-control" id="session-add-column-name-${colNumber}" placeholder="Name..." type="text" maxlength="32" required>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="form-group">
                          <label for="session-add-column-board-${colNumber}">Column Board - ${colNumber}</label>
                          <select class="form-control" id="session-add-column-board-${colNumber}">
                            
                          </select>
                        </div>
                      </div>
                      <div class="col-md-3">
                        <div class="form-group">
                          <label for="session-add-column-sensor-${colNumber}">Column Sensor - ${colNumber}</label>
                          <select class="form-control" id="session-add-column-sensor-${colNumber}">
                           
                          </select>
                        </div>
                      </div>
                      <div class="col-md-2 session-add-col-btns" id="session-add-col-btns-${colNumber}">
                        <div class="btn-group" role="group" id="session-add-col-btns">
                        <button type="button" class="btn btn-danger" onclick="deleteSessionColumn();"><i class="fa fa-trash fa-lg mt-2 button-icon"></i></button>
                          <button type="button" class="btn btn-success" onclick="addSessionColumn();"><i class="fa fa-plus fa-lg mt-2 button-icon"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
    `);
    $('#session-add-column-board-'+colNumber).change(colBoardChange);
    updateBoardHtml(colNumber);
    updateSensors(colNumber);
}

function deleteSessionColumn() {
    var column = $('#session-add-columns');
    var delColumnNo = column.children().length-1;
    column.children().eq(delColumnNo).remove();
    var delBtn = delColumnNo !== 1 ? `<button type="button" class="btn btn-danger" onclick="deleteSessionColumn();"><i class="fa fa-trash fa-lg mt-2 button-icon"></i></button>` : ``;
    $(`#session-add-col-btns-${delColumnNo}`).html(`
                        <div class="btn-group" role="group" id="session-add-col-btns">
                          ${delBtn}
                          <button type="button" class="btn btn-success" onclick="addSessionColumn();"><i class="fa fa-plus fa-lg mt-2 button-icon"></i></button>
                        </div>
    `);
}

function addLoggingSession() {
    //Grab Request Data
    var sessionName = $('#session-add-name').val();
    var sessionInterval = $('#session-add-interval').val();
    var sessionColumns = [];
    var noCols = $('#session-add-columns').children().length;
    for(var i=0; i<noCols; i++) {
        sessionColumns.push({
            columnName: $(`#session-add-column-name-${i+1}`).val(),
            columnSensorID: $(`#session-add-column-sensor-${i+1}`)[0].selectedOptions[0].dataset.sensorid
        });
    }
    var reqData = {
        sessionName,
        sessionInterval,
        sessionColumns
    };
    //Error Checking
    if(!reqData.sessionName) return notify('danger', 'Error', 'Session Name must be filled out');
    if(!reqData.sessionInterval) return notify('danger', 'Error', 'Session Interval must be filled out');
    if(!reqData.sessionColumns || reqData.sessionColumns.length < 1) return notify('danger', 'Error', 'Session columns undefined');
    for(var i=0; i<noCols; i++) {
        if(!reqData.sessionColumns[i].columnName) return notify('danger', 'Error', `Session column name ${i+1} must be filled out`);
        if(!reqData.sessionColumns[i].columnSensorID) return notify('danger', 'Error', `Session column sensor ${i+1} must be filled out`);
    }
    if(reqData.sessionInterval < 75 || reqData.sessionInterval > 600000) return notify('danger', 'Error', 'Logging interval must be between 75 and 600000');
    $.ajax({
        url: '/api/logging-home/add-session',
        type: 'POST',
        data: JSON.stringify(reqData),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            if(data.success) return window.location.reload(true);
            return notify('danger', 'Error', 'There was an error when adding the logging session.');
        }
    });
}

/*
    Util Functions
 */

function notify(type,title,message){
    $.notify({
        title: title,
        message: message
    },{
        element: 'body',
        position: null,
        type: type,
        allow_dismiss: true,
        newest_on_top: true,
        placement: {
            from: "top",
            align: "center"
        },
        offset: 20,
        spacing: 10,
        z_index: 1100,
        delay: 5000,
        timer: 1000
    });
}