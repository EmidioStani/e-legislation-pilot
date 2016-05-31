/*
(c)  Crown copyright

You may use and re-use this code free of charge under the terms of the Open Government Licence v3.0

http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3

*/

$(document).ready(function () {
  //Initialize timeline
  $("#timeline").addSlider({"timerValue": 40,	"sliderStep": 2, "keyNavigation": 1, "viewPos": "right"});
  //Timeline hover
  $("li:not(.currentVersion) .pointer").hover(function(){
      $(this).css("background", "url(/legislation-pilot/images/pointInTimeMarkerActive.png) 0 0 no-repeat");
      }, function(){
      $(this).css("background", "url(/legislation-pilot/images/pointInTimeTimelineMarker.png) 0 0 no-repeat");
  });
});

/*
Timeline Slider

One-liner: Adds custom slider and optional fisheye to timeline
Usage: .addSlider(options);
timerValue - the speed of the slider (time in milliseconds between each move)
sliderStep - the amount to move the slider when arrow button clicked
keyNavigation - enable global arrow key handler

Required structure:

Fisheye enabled if #resultsTimeline has class "fisheye"

#resultsTimeline #timeline #timelineData
#resultsTimeline #decades

JS Requirements: jQuery 1.4, jQuery UI 1.8, jQuery UI slider plugin

History:
v0.01   TE 2010-05-21   Created
v0.02   GE 2010-05-27   Set so that initial view is set to the far right (to the latest section of a

timeline/histogram)
                        if init option value 'viewPos': 'right'
v0.03   GE 2010-05-28   Slider positioning logic to place above the 'decades' block if it exists, else just append to the end of #timeline.parent().
                        Default fisheye position moved to right if viewPos=right
v0.04   TE 2010-02-06   Fixed for xhtml content type
v0.05   TE 2010-02-08   Adapted for Point in Time
v0.06   TE 2010-06-21   Added global persistance for slider position
v0.07   TE 2010-06-23   Removed cookie, timeline now centres on relevant date, point in time on currentversion
v.0.8   TE 2010-07-14   Fixed focus for timelines with centuries view

*/
$.fn.addSlider = function (values) {
    var timer,
        down = false,
        timerValue = values.timerValue,
        sliderStep = values.sliderStep,
        keyNavigation = values.keyNavigation,
        timelineViewPos = values.viewPos, // default: to the left
        timeline = $(this),
        timelineData = $("#timeline #timelineData"),
        // include padding in width. timelineDataWidth.outerWidth() won't be right for padded children
        timelineDataWidth = 107,	//Initial width to account for parent padding
        decades = $(".decades"),
        fisheye = $(""),
        decadesMarginLeft,
        scrollPos,
        sliderPos,
        points,
        pointWidth,
        scrollbar,
        scrollbarStructure,
        slider,
        arrowLeft,
        arrowRight,
        fisheyeOffset,
        temp,
        path,
        regex,
        year,
        link,
        linkPosition,
        ui,
        childrenUL,
        childrenLI,
        childrenNotInTime,
        timelineParent;

    //disable arrows at limits
    function checkArrows(ui) {
        if (ui.value === 0) {
            arrowLeft.addClass("arrowLeftDisabled").removeClass("arrowLeftEnabled");
            arrowRight.addClass("arrowLeftEnabled").removeClass("arrowLeftDisabled");
        } else if (ui.value === 100) {
            arrowLeft.addClass("arrowLeftEnabled").removeClass("arrowLeftDisabled");
            arrowRight.addClass("arrowRightDisabled").removeClass("arrowRightEnabled");
        } else {
            arrowLeft.addClass("arrowLeftEnabled").removeClass("arrowLeftDisabled");
            arrowRight.addClass("arrowRightEnabled").removeClass("arrowRightDisabled");
        }
    }

    // update timeline and fisheye position
    function update(e, ui) {
        // account for part of timeline within view
        var maxScroll = timelineDataWidth - timeline.width();
        timeline.scrollLeft(maxScroll * ui.value / 100);
        //console.log(ui.value);
        fisheye.css("left", (timeline.scrollLeft() * decades.width() / timelineDataWidth) + fisheyeOffset);
        checkArrows(ui);
    }

    function setSliderValue(value) {
        var min = 0,
            max = 100;

        slider.slider("option", "value", value);
        if (value <= min) {
            slider.slider("option", "value", min);
        } else if (value >= max) {
            slider.slider("option", "value", max);
        }
    }

    // move slider one step
    function moveLeft() {
        var value = slider.slider("option", "value");
        setSliderValue(value - sliderStep);
        timer = setTimeout(moveLeft, timerValue);
    }

    function moveRight() {
        var value = slider.slider("option", "value");
        setSliderValue(value + sliderStep);
        timer = setTimeout(moveRight, timerValue);
    }

    childrenUL = timelineData.children("ul");
    childrenLI = childrenUL.children("li");
    childrenLI.each(function () {
        timelineDataWidth += $(this).outerWidth();
    });
    childrenUL.children("li:last-of-type").append('<span class="end"/>');

    if (decades.length > 0) {
        decadesMarginLeft = parseInt(decades.css("margin-left").replace("px", ""), 10); // forcetype as integer
    }

    if (timelineDataWidth < timeline.width()) {
        childrenNotInTime = childrenLI.not(".pointInTime");
        points = childrenNotInTime.length;
        pointWidth = Math.floor((timeline.width() - 107) / points);
        childrenNotInTime.css("width", pointWidth + "px");
    }

    if (timelineDataWidth >= timeline.width()) {
        timelineData.css("width", timelineDataWidth + "px");
        // Set vars for default position of histogram view
        if (timelineViewPos === "right") { // view to right
            sliderPos = 100;
            scrollPos = timelineDataWidth - timeline.width();
        } else { // view to left
            sliderPos = 0;
            scrollPos = 0;
        }

        // hide existing scrollbar
        timeline.css("overflow", "hidden");

        // Position the scrollbar depending on whether there is a decades list
        timelineParent = timeline.parent();
        scrollbar = $('<div id="scrollbar"></div>');
        timelineParent.append(scrollbar); // Default at the end of block
        if (decades.length) {
            timelineParent.append(decades); // Move the decades block after the slider if it exists
        }

        scrollbarStructure = '<div id="handle" class="ui-slider-handle"></div>';
        scrollbarStructure += '<a id="arrowLeft" class="arrow arrowLeftDisabled" href=""></a><span class="sliderEnd"></span><div id="slider"></div><span class="sliderEnd"></span><a id="arrowRight" class="arrow arrowRightEnabled" href=""></a>';
        scrollbar.append(scrollbarStructure);

        slider = $("#slider");
        arrowLeft = $("#arrowLeft");
        arrowRight = $("#arrowRight");
        slider.slider({animate: false, change: update, slide: update, step: sliderStep, value: sliderPos});

        // Set initial view of timeline
        timeline.scrollLeft(scrollPos);

        // add fisheye if parent has fisheye class
        if (timelineParent.hasClass("fisheye")) {
            timelineParent.append('<div id="fisheye"></div>');
            fisheye = $("#fisheye");

            // account for absolute positioning offset
            fisheyeOffset = fisheye.position().left + decadesMarginLeft;
            fisheye.width(timeline.width() / timelineDataWidth * decades.width());

            // Set default pos to right if required
            if (timelineViewPos === "right") {
                fisheye.css("left", (timeline.scrollLeft() * decades.width() / timelineDataWidth) + fisheyeOffset);
            }
        }

        // move slider on mousedown or keydown. When held down, mousedown fires only once, keydown repeatedly.
        arrowLeft
            .mousedown(moveLeft)
            .keydown(function (e) {
                // ignore all but initial keydown event. ignore all but enter key
                if (!down && e.keyCode === 13) {
                    down = true;
                    moveLeft();
                }
            })
            .mouseup(function () {clearTimeout(timer); })
            .mouseleave(function () {clearTimeout(timer); })
            .keyup(function () {down = false; clearTimeout(timer); });

        arrowRight
            .mousedown(moveRight)
            .keydown(function (e) {
                if (!down && e.keyCode === 13) {
                    down = true;
                    moveRight();
                }
            })
            .mouseup(function () {clearTimeout(timer); })
            .mouseleave(function () {clearTimeout(timer); })
            .keyup(function () {down = false; clearTimeout(timer); });

        // hook arrow keys
        if (keyNavigation) {
            $(document)
                .keydown(function (e) {
                    if (!down && e.keyCode === 37) {
                        down = true;
                        moveLeft();
                    } else if (!down && e.keyCode === 39) {
                        down = true;
                        moveRight();
                    }
                })
                .keyup(function () {down = false; clearTimeout(timer); });
        }

        //prevent default link action
        $(".arrow").click(function () {
            return false;
        });

        // disable arrow if slider right
        if (timelineViewPos === "right") {
            temp = {};
            temp.value = 100;
            checkArrows(temp);
        }

        /*
        // save clicked link to cookie using href, centre in timeline when page next visited
        if (values["cookie"]) {
            var cookieArray = new Object();
            var key = location.pathname;
            readCookie("sliderPos", cookieArray);

            if (cookieArray[key]) {
                var link = $("a[href$=\"" + cookieArray[key] + "\"]", timeline);
                var linkPosition = link.offset().left - timelineData.offset().left - (timeline.width() / 2);
                timeline.scrollLeft(linkPosition);

                var ui = new Object();
                ui["value"] = linkPosition * 100 / (timelineDataWidth - timeline.width());
                update(null, ui);	

                slider.slider("option", "value", ui["value"]);
            }

            // save link's href attribute to cookie
            $("a", timeline).click(function(event) {
                updateid("sliderPos", cookieArray, key, $(this).attr("href"), cookieExpire);
            });
        }*/

        // timeline
        // match /ukpga/1977 etc
        path = location.pathname;
        regex = /\/[^\/]*\/\d*-?\d*$/;

        //var year = path.match(regex);
        year = [ "2015" ];

        if (year) {
            year = year[0];
        }

        link = $("a[href$='" + year + "']", timeline);

        if (link.length !== 1) {
            link = $("#timeline #timelineData .currentVersion");
        }

        if (link.length === 1) {
            linkPosition = link.offset().left - timelineData.offset().left - (timeline.width() / 2);
            timeline.scrollLeft(linkPosition);

            ui = {};

            // (divided by maxscroll)
            ui.value = linkPosition * 100 / (timelineDataWidth - timeline.width());
            update(null, ui);

            setSliderValue(ui.value);
        }
    }

};
