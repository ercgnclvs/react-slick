"use strict";

import React from "react";
import classnames from "classnames";
import {
  lazyStartIndex,
  lazyEndIndex,
  getPreClones
} from "./utils/innerSliderUtils";
import { deprecate } from "util";

var mod = (n, m) => {
  return ((n % m) + m) % m;
};

// sync current slide with visible slides
var isCurrentSlide = spec => {
  // const linkedSlidesToShow = spec.linkedSlidesToShow || 1;

  // let offset = new Array(linkedSlidesToShow);
  // let ctr = Math.floor(linkedSlidesToShow / 2) * -1;

  // for (let i = 0; i < linkedSlidesToShow; i++) {
  //   offset[i] = spec.currentSlide + ctr;
  //   ctr += 1;
  // }

  // let offset2 = new Array(linkedSlidesToShow);
  // for (let j = 0; j < linkedSlidesToShow; j++) {
  //   offset2[j] = offset[j] - spec.slideCount;
  // }

  // return [...offset, ...offset2].includes(spec.index);

  const offset = [];
  const max = Math.floor(spec.linkedSlidesToShow / 2);
  const min = max * -1;

  for (let i = min; i <= max; i++) {
    offset.push(i);
  }

  if (mod(spec.index, 6) === spec.slideCount - 1) {
    console.log(spec.index);
  }

  if (spec.index === -5) {
    console.log("****");
    console.log(spec.slideCount - 1);
    console.log(spec.index);
    console.log(mod(-5, 6), mod(5, 6));
    console.log("****");
  }

  offset.push(5);
  offset.push(-5);

  return offset.includes((spec.index - spec.currentSlide) % spec.slideCount);
};

// given specifications/props for a slide, fetch all the classes that need to be applied to the slide
var getSlideClasses = spec => {
  var slickActive, slickCenter, slickCloned;
  var centerOffset, index;

  if (spec.rtl) {
    index = spec.slideCount - 1 - spec.index;
  } else {
    index = spec.index;
  }
  slickCloned = index < 0 || index >= spec.slideCount;
  if (spec.centerMode) {
    centerOffset = Math.floor(spec.slidesToShow / 2);
    slickCenter = (index - spec.currentSlide) % spec.slideCount === 0;

    if (
      index > spec.currentSlide - centerOffset - 1 &&
      index <= spec.currentSlide + centerOffset
    ) {
      slickActive = true;
    }
  } else {
    slickActive =
      spec.currentSlide <= index &&
      index < spec.currentSlide + spec.slidesToShow;
  }

  let slickCurrent = isCurrentSlide(spec);

  return {
    "slick-slide": true,
    "slick-active": slickActive,
    "slick-center": slickCenter,
    "slick-cloned": slickCloned,
    "slick-current": slickCurrent // dubious in case of RTL
  };
};

var getSlideStyle = function(spec) {
  var style = {};

  if (spec.variableWidth === undefined || spec.variableWidth === false) {
    style.width = spec.slideWidth;
  }

  if (spec.fade) {
    style.position = "relative";
    if (spec.vertical) {
      style.top = -spec.index * parseInt(spec.slideHeight);
    } else {
      style.left = -spec.index * parseInt(spec.slideWidth);
    }
    style.opacity = spec.currentSlide === spec.index ? 1 : 0;
    style.transition =
      "opacity " +
      spec.speed +
      "ms " +
      spec.cssEase +
      ", " +
      "visibility " +
      spec.speed +
      "ms " +
      spec.cssEase;
    style.WebkitTransition =
      "opacity " +
      spec.speed +
      "ms " +
      spec.cssEase +
      ", " +
      "visibility " +
      spec.speed +
      "ms " +
      spec.cssEase;
  }

  return style;
};

const getKey = (child, fallbackKey) => child.key || fallbackKey;

var renderSlides = function(spec) {
  var key;
  var slides = [];
  var preCloneSlides = [];
  var postCloneSlides = [];
  var childrenCount = React.Children.count(spec.children);
  let startIndex = lazyStartIndex(spec);
  let endIndex = lazyEndIndex(spec);

  React.Children.forEach(spec.children, (elem, index) => {
    let child;
    var childOnClickOptions = {
      message: "children",
      index: index,
      slidesToScroll: spec.slidesToScroll,
      currentSlide: spec.currentSlide
    };

    // in case of lazyLoad, whether or not we want to fetch the slide
    if (
      !spec.lazyLoad ||
      (spec.lazyLoad && spec.lazyLoadedList.indexOf(index) >= 0)
    ) {
      child = elem;
    } else {
      child = <div />;
    }
    var childStyle = getSlideStyle({ ...spec, index });
    const slideClass = child.props.className || "";
    let slideClasses = getSlideClasses({ ...spec, index });
    // push a cloned element of the desired slide
    slides.push(
      React.cloneElement(child, {
        key: "original" + getKey(child, index),
        "data-index": index,
        className: classnames(slideClasses, slideClass),
        tabIndex: "-1",
        "aria-hidden": !slideClasses["slick-active"],
        style: { outline: "none", ...(child.props.style || {}), ...childStyle },
        onClick: e => {
          child.props && child.props.onClick && child.props.onClick(e);
          if (spec.focusOnSelect) {
            spec.focusOnSelect(childOnClickOptions);
          }
        }
      })
    );

    // if slide needs to be precloned or postcloned
    if (spec.infinite && spec.fade === false) {
      let preCloneNo = childrenCount - index;
      if (
        preCloneNo <= getPreClones(spec) &&
        childrenCount !== spec.slidesToShow
      ) {
        key = -preCloneNo;
        if (key >= startIndex) {
          child = elem;
        }
        slideClasses = getSlideClasses({ ...spec, index: key });
        preCloneSlides.push(
          React.cloneElement(child, {
            key: "precloned" + getKey(child, key),
            "data-index": key,
            tabIndex: "-1",
            className: classnames(slideClasses, slideClass),
            "aria-hidden": !slideClasses["slick-active"],
            style: { ...(child.props.style || {}), ...childStyle },
            onClick: e => {
              child.props && child.props.onClick && child.props.onClick(e);
              if (spec.focusOnSelect) {
                spec.focusOnSelect(childOnClickOptions);
              }
            }
          })
        );
      }

      if (childrenCount !== spec.slidesToShow) {
        key = childrenCount + index;
        if (key < endIndex) {
          child = elem;
        }
        slideClasses = getSlideClasses({ ...spec, index: key });
        postCloneSlides.push(
          React.cloneElement(child, {
            key: "postcloned" + getKey(child, key),
            "data-index": key,
            tabIndex: "-1",
            className: classnames(slideClasses, slideClass),
            "aria-hidden": !slideClasses["slick-active"],
            style: { ...(child.props.style || {}), ...childStyle },
            onClick: e => {
              child.props && child.props.onClick && child.props.onClick(e);
              if (spec.focusOnSelect) {
                spec.focusOnSelect(childOnClickOptions);
              }
            }
          })
        );
      }
    }
  });

  if (spec.rtl) {
    return preCloneSlides.concat(slides, postCloneSlides).reverse();
  } else {
    return preCloneSlides.concat(slides, postCloneSlides);
  }
};

export class Track extends React.PureComponent {
  render() {
    const slides = renderSlides(this.props);
    const { onMouseEnter, onMouseOver, onMouseLeave } = this.props;
    const mouseEvents = { onMouseEnter, onMouseOver, onMouseLeave };
    return (
      <div
        className="slick-track"
        style={this.props.trackStyle}
        {...mouseEvents}
      >
        {slides}
      </div>
    );
  }
}
