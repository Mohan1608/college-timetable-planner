var autoRefreshIntervalId = null;
let currentUserRoles = [];

function hasRole(role) {
  console.log("Checking role:", role, "against", currentUserRoles);
  return currentUserRoles.some(r => r === "ROLE_" + role);
}

function applyRoleBasedUI() {

  // ---------- STUDENT ----------
  if (isStudent()) {

    // Hide Room & Teacher tabs
    $("#byRoomTab").hide();
    $("#byTeacherTab").hide();
    $("#solveButton").remove();

    // Show only Student Group tab
    $("#byStudentGroupTab").show();

    // Deactivate others
    $("#byTeacher").removeClass("show active");

    // Activate Student Group tab + panel
    $("#byStudentGroupTab").addClass("active");
    $("#byStudentGroup").addClass("show active");
    $("#addLessonBtn").remove();
        $("#addTimeslotBtn").remove();
        $("#addRoomBtn").remove();

    return; // 🔴 IMPORTANT: stop further execution
  }

  // ---------- TEACHER ----------
  if (isTeacher()) {
  $("#byRoomTab").hide();
  $("#solveButton").remove();

  $("#byRoomTab").removeClass("show active");

  $("#byTeacherTabTab").addClass("active");
  $("#byTeacherTab").addClass("show active");
    $("#byTeacherTab").show();
    $("#byStudentGroupTab").show();

        $("#addTimeslotBtn").remove();
        $("#addRoomBtn").remove();
    return;
  }

  // ---------- ADMIN ----------
  if (isAdmin()) {
    $("#byRoomTab").show();
    $("#byTeacherTab").show();
    $("#byStudentGroupTab").show();
  }
}

function isAdmin() {
  return hasRole("ADMIN");
}

function isTeacher() {
  return hasRole("TEACHER");
}

function isStudent() {
  return hasRole("STUDENT");
}

function refreshTimeTable() {
 $("#timetable").empty();        // ⬅ VERY IMPORTANT
  $("#headerRowByRoom").empty();
  $("#headerRowByTeacher").empty();
  $("#headerRowByStudentGroup").empty();

  $.getJSON("/timeTable", function (timeTable) {
    refreshSolvingButtons(
      timeTable.solverStatus != null && timeTable.solverStatus !== "NOT_SOLVING"
    );
    $("#score").text(
      "Score: " + (timeTable.score == null ? "?" : timeTable.score)
    );

    const timeTableByRoom = $("#timeTableByRoom");
    timeTableByRoom.children().remove();
    const timeTableByTeacher = $("#timeTableByTeacher");
    timeTableByTeacher.children().remove();
    const timeTableByStudentGroup = $("#timeTableByStudentGroup");
    timeTableByStudentGroup.children().remove();
    const unassignedLessons = $("#unassignedLessons");
    unassignedLessons.children().remove();

    const theadByRoom = $("<thead>").appendTo(timeTableByRoom);
    const headerRowByRoom = $("<tr>").appendTo(theadByRoom);
    headerRowByRoom.append($("<th>Timeslot</th>"));
    $.each(timeTable.roomList, (index, room) => {
      const th = $("<th/>").append(
        $("<span/>").text(room.name)
      );

      if (hasRole("ADMIN")) {
        th.append(
          $('<button type="button" class="ml-2 mb-1 btn btn-light btn-sm p-1"/>')
            .append($('<small class="fas fa-trash"/>'))
            .click(() => deleteRoom(room))
        );
      }

      headerRowByRoom.append(th);
    });
    const theadByTeacher = $("<thead>").appendTo(timeTableByTeacher);
    const headerRowByTeacher = $("<tr>").appendTo(theadByTeacher);
    headerRowByTeacher.append($("<th>Timeslot</th>"));
    const teacherList = [
      ...new Set(timeTable.lessonList.map((lesson) => lesson.teacher)),
    ];
    $.each(teacherList, (index, teacher) => {
      headerRowByTeacher.append($("<th/>").append($("<span/>").text(teacher)));
    });
    const theadByStudentGroup = $("<thead>").appendTo(timeTableByStudentGroup);
    const headerRowByStudentGroup = $("<tr>").appendTo(theadByStudentGroup);
    headerRowByStudentGroup.append($("<th>Timeslot</th>"));
    const studentGroupList = [
      ...new Set(timeTable.lessonList.map((lesson) => lesson.studentGroup)),
    ];
    $.each(studentGroupList, (index, studentGroup) => {
      headerRowByStudentGroup.append(
        $("<th/>").append($("<span/>").text(studentGroup))
      );
    });

    const tbodyByRoom = $("<tbody>").appendTo(timeTableByRoom);
    const tbodyByTeacher = $("<tbody>").appendTo(timeTableByTeacher);
    const tbodyByStudentGroup = $("<tbody>").appendTo(timeTableByStudentGroup);
    $.each(timeTable.timeslotList, (index, timeslot) => {
      const rowByRoom = $("<tr>").appendTo(tbodyByRoom);
        const thTimeslot = $(`<th class="align-middle"/>`).append(
          $("<span/>")
            .text(`
                    ${
                      timeslot.dayOfWeek.charAt(0) +
                      timeslot.dayOfWeek.slice(1).toLowerCase()
                    }
                    ${moment(timeslot.startTime, "HH:mm:ss").format("HH:mm")}
                    -
                    ${moment(timeslot.endTime, "HH:mm:ss").format("HH:mm")}
                `
            )
        );
        if (isAdmin()) {
          thTimeslot.append(
            $('<button class="ml-2 mb-1 btn btn-light btn-sm p-1"/>')
              .append($('<small class="fas fa-trash"/>'))
              .click(() => deleteTimeslot(timeslot))
          );
        }
      rowByRoom.append(thTimeslot);

      const rowByTeacher = $("<tr>").appendTo(tbodyByTeacher);
      rowByTeacher.append(
        $(`<th class="align-middle"/>`).append(
          $("<span/>").text(`
                    ${
                      timeslot.dayOfWeek.charAt(0) +
                      timeslot.dayOfWeek.slice(1).toLowerCase()
                    }
                    ${moment(timeslot.startTime, "HH:mm:ss").format("HH:mm")}
                    -
                    ${moment(timeslot.endTime, "HH:mm:ss").format("HH:mm")}
                `)
        )
      );
      $.each(timeTable.roomList, (index, room) => {
        rowByRoom.append(
          $("<td/>").prop("id", `timeslot${timeslot.id}room${room.id}`)
        );
      });
      const rowByStudentGroup = $("<tr>").appendTo(tbodyByStudentGroup);
      rowByStudentGroup.append(
        $(`<th class="align-middle"/>`).append(
          $("<span/>").text(`
                    ${
                      timeslot.dayOfWeek.charAt(0) +
                      timeslot.dayOfWeek.slice(1).toLowerCase()
                    }
                    ${moment(timeslot.startTime, "HH:mm:ss").format("HH:mm")}
                    -
                    ${moment(timeslot.endTime, "HH:mm:ss").format("HH:mm")}
                `)
        )
      );

      $.each(teacherList, (index, teacher) => {
        rowByTeacher.append(
          $("<td/>").prop(
            "id",
            `timeslot${timeslot.id}teacher${convertToId(teacher)}`
          )
        );
      });

      $.each(studentGroupList, (index, studentGroup) => {
        rowByStudentGroup.append(
          $("<td/>").prop(
            "id",
            `timeslot${timeslot.id}studentGroup${convertToId(studentGroup)}`
          )
        );
      });
    });

    $.each(timeTable.lessonList, (index, lesson) => {
      const color = pickColor(lesson.subject);
      const lessonElementWithoutDelete = $(
        `<div class="card lesson" style="background-color: ${color}"/>`
      ).append(
        $(`<div class="card-body p-2"/>`)
          .append($(`<h5 class="card-title mb-1"/>`).text(lesson.subject))
          .append(
            $(`<p class="card-text ml-2 mb-1"/>`).append(
              $(`<em/>`).text(`by ${lesson.teacher}`)
            )
          )
          .append(
            $(
              `<small class="ml-2 mt-1 card-text text-muted align-bottom float-right"/>`
            ).text(lesson.id)
          )
          .append($(`<p class="card-text ml-2"/>`).text(lesson.studentGroup))
      );
      const lessonElement = lessonElementWithoutDelete.clone();
      if (isAdmin()) {
        lessonElement.find(".card-body").prepend(
          $('<button type="button" class="ml-2 btn btn-light btn-sm p-1 float-right"/>')
            .append($('<small class="fas fa-trash"/>'))
            .click(() => deleteLesson(lesson))
        );
      }
      if (lesson.timeslot == null || lesson.room == null) {
        unassignedLessons.append(lessonElement);
      } else {
        $(`#timeslot${lesson.timeslot.id}room${lesson.room.id}`).append(
          lessonElement
        );
        $(
          `#timeslot${lesson.timeslot.id}teacher${convertToId(lesson.teacher)}`
        ).append(lessonElementWithoutDelete.clone());
        $(
          `#timeslot${lesson.timeslot.id}studentGroup${convertToId(
            lesson.studentGroup
          )}`
        ).append(lessonElementWithoutDelete.clone());
      }
    });
  });
}

function convertToId(str) {
  // Base64 encoding without padding to avoid XSS
  return btoa(str).replace(/=/g, "");
}

function solve() {
  $.post("/timeTable/solve", function () {
    refreshSolvingButtons(true);
  }).fail(function (xhr, ajaxOptions, thrownError) {
    showError("Start solving failed.", xhr);
  });
}

function refreshSolvingButtons(solving) {
  if (solving) {
    $("#solveButton").hide();
    $("#stopSolvingButton").show();
    if (autoRefreshIntervalId == null) {
      autoRefreshIntervalId = setInterval(refreshTimeTable, 2000);
    }
  } else {
    $("#solveButton").show();
    $("#stopSolvingButton").hide();
    if (autoRefreshIntervalId != null) {
      clearInterval(autoRefreshIntervalId);
      autoRefreshIntervalId = null;
    }
  }
}

function stopSolving() {
  $.post("/timeTable/stopSolving", function () {
    refreshSolvingButtons(false);
    refreshTimeTable();
  }).fail(function (xhr, ajaxOptions, thrownError) {
    showError("Stop solving failed.", xhr);
  });
}

function addLesson() {
  var subject = $("#lesson_subject").val().trim();
  $.post(
    "/lessons",
    JSON.stringify({
      subject: subject,
      teacher: $("#lesson_teacher").val().trim(),
      studentGroup: $("#lesson_studentGroup").val().trim(),
    }),
    function () {
      refreshTimeTable();
    }
  ).fail(function (xhr, ajaxOptions, thrownError) {
    showError("Adding lesson (" + subject + ") failed.", xhr);
  });
  $("#lessonDialog").modal("toggle");
}

function deleteLesson(lesson) {
  $.delete("/lessons/" + lesson.id, function () {
    refreshTimeTable();
  }).fail(function (xhr, ajaxOptions, thrownError) {
    showError("Deleting lesson (" + lesson.name + ") failed.", xhr);
  });
}

function addTimeslot() {
  $.post(
    "/timeslots",
    JSON.stringify({
      dayOfWeek: $("#timeslot_dayOfWeek").val().trim().toUpperCase(),
      startTime: $("#timeslot_startTime").val().trim(),
      endTime: $("#timeslot_endTime").val().trim(),
    }),
    function () {
      refreshTimeTable();
    }
  ).fail(function (xhr, ajaxOptions, thrownError) {
    showError("Adding timeslot failed.", xhr);
  });
  $("#timeslotDialog").modal("toggle");
}

function deleteTimeslot(timeslot) {
  $.delete("/timeslots/" + timeslot.id, function () {
    refreshTimeTable();
  }).fail(function (xhr, ajaxOptions, thrownError) {
    showError("Deleting timeslot (" + timeslot.name + ") failed.", xhr);
  });
}

function addRoom() {
  var name = $("#room_name").val().trim();
  $.post(
    "/rooms",
    JSON.stringify({
      name: name,
    }),
    function () {
      refreshTimeTable();
    }
  ).fail(function (xhr, ajaxOptions, thrownError) {
    showError("Adding room (" + name + ") failed.", xhr);
  });
  $("#roomDialog").modal("toggle");
}

function deleteRoom(room) {
  $.delete("/rooms/" + room.id, function () {
    refreshTimeTable();
  }).fail(function (xhr, ajaxOptions, thrownError) {
    showError("Deleting room (" + room.name + ") failed.", xhr);
  });
}

function showError(title, xhr) {
  const serverErrorMessage = !xhr.responseJSON
    ? `${xhr.status}: ${xhr.statusText}`
    : xhr.responseJSON.message;
  console.error(title + "\n" + serverErrorMessage);
  const notification = $(
    `<div class="toast" role="alert" aria-live="assertive" aria-atomic="true" style="min-width: 30rem"/>`
  )
    .append(
      $(`<div class="toast-header bg-danger">
                 <strong class="mr-auto text-dark">Error</strong>
                 <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                   <span aria-hidden="true">&times;</span>
                 </button>
               </div>`)
    )
    .append(
      $(`<div class="toast-body"/>`)
        .append($(`<p/>`).text(title))
        .append($(`<pre/>`).append($(`<code/>`).text(serverErrorMessage)))
    );
  $("#notificationPanel").append(notification);
  notification.toast({ delay: 30000 });
  notification.toast("show");
}

$(document).ready(function () {
  $.ajaxSetup({
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  // Extend jQuery to support $.put() and $.delete()
  jQuery.each(["put", "delete"], function (i, method) {
    jQuery[method] = function (url, data, callback, type) {
      if (jQuery.isFunction(data)) {
        type = type || callback;
        callback = data;
        data = undefined;
      }
      return jQuery.ajax({
        url: url,
        type: method,
        dataType: type,
        data: data,
        success: callback,
      });
    };
  });

  $("#refreshButton").click(function () {
    refreshTimeTable();
  });
  $("#solveButton").click(function () {
    solve();
  });
  $("#stopSolvingButton").click(function () {
    stopSolving();
  });
  $("#addLessonSubmitButton").click(function () {
    addLesson();
  });
  $("#addTimeslotSubmitButton").click(function () {
    addTimeslot();
  });
  $("#addRoomSubmitButton").click(function () {
    addRoom();
  });
    // 🔐 NEW: load logged-in user roles
      $.getJSON("/api/auth/me", function (user) {
        currentUserRoles = user.roles;
        applyRoleBasedUI();
        refreshTimeTable();
      });
});

// ****************************************************************************
// TangoColorFactory
// ****************************************************************************

const SEQUENCE_1 = [0x8ae234, 0xfce94f, 0x729fcf, 0xe9b96e, 0xad7fa8];
const SEQUENCE_2 = [0x73d216, 0xedd400, 0x3465a4, 0xc17d11, 0x75507b];

var colorMap = new Map();
var nextColorCount = 0;

function pickColor(object) {
  let color = colorMap[object];
  if (color !== undefined) {
    return color;
  }
  color = nextColor();
  colorMap[object] = color;
  return color;
}

function nextColor() {
  let color;
  let colorIndex = nextColorCount % SEQUENCE_1.length;
  let shadeIndex = Math.floor(nextColorCount / SEQUENCE_1.length);
  if (shadeIndex === 0) {
    color = SEQUENCE_1[colorIndex];
  } else if (shadeIndex === 1) {
    color = SEQUENCE_2[colorIndex];
  } else {
    shadeIndex -= 3;
    let floorColor = SEQUENCE_2[colorIndex];
    let ceilColor = SEQUENCE_1[colorIndex];
    let base = Math.floor(shadeIndex / 2 + 1);
    let divisor = 2;
    while (base >= divisor) {
      divisor *= 2;
    }
    base = base * 2 - divisor + 1;
    let shadePercentage = base / divisor;
    color = buildPercentageColor(floorColor, ceilColor, shadePercentage);
  }
  nextColorCount++;
  return "#" + color.toString(16);
}

function buildPercentageColor(floorColor, ceilColor, shadePercentage) {
  let red =
    ((floorColor & 0xff0000) +
      Math.floor(
        shadePercentage * ((ceilColor & 0xff0000) - (floorColor & 0xff0000))
      )) &
    0xff0000;
  let green =
    ((floorColor & 0x00ff00) +
      Math.floor(
        shadePercentage * ((ceilColor & 0x00ff00) - (floorColor & 0x00ff00))
      )) &
    0x00ff00;
  let blue =
    ((floorColor & 0x0000ff) +
      Math.floor(
        shadePercentage * ((ceilColor & 0x0000ff) - (floorColor & 0x0000ff))
      )) &
    0x0000ff;
  return red | green | blue;
}
