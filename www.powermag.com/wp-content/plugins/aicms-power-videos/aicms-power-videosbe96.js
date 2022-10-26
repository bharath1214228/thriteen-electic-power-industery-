jQuery(document).ready(function() {
	//check if sliders should be moved, and if so, move them
	function moveSlider(slider, direction) {

		//do not move if it is already in the middle of an animation
		if (slider.data('animating')) {
			return;
		}

		//vars used to calculate position in container
		var sliderContent = slider.find('.slider-content');
		var sliderContentWidth = sliderContent.width();
		var containerWidth = slider.find('.slider-container').width();
		var leftPosition = parseInt(sliderContent.css('left'), 10);

		//left
		if (direction == 'left' && leftPosition < 0) {
			slider.data('animating', true);
			leftPosition += containerWidth;
			sliderContent.animate(
				{left: leftPosition},
				500,
				'swing',
				function() {
					slider.data('animating', false);
					setSliderArrows(slider);
				}
			);
		}
		//right
		else if (direction == 'right' && leftPosition > containerWidth - sliderContentWidth) {
			slider.data('animating', true);
			leftPosition -= containerWidth;
			sliderContent.animate(
				{left: leftPosition},
				500,
				'swing',
				function() {
					slider.data('animating', false);
					setSliderArrows(slider);
				}
			);
		}
	}

	//fade out slider arrows if we are at the edge of the slider content
	function setSliderArrows(slider) {
		var sliderContent = slider.find('.slider-content');
		var sliderContentWidth = sliderContent.width();
		var containerWidth = slider.find('.slider-container').width();
		var leftPosition = parseInt(sliderContent.css('left'), 10);
		//left arrow
		if (leftPosition < 0) {
			slider.find('.arrow.left').fadeTo(0, 1.0);
		}
		else {
			slider.find('.arrow.left').fadeTo(0, 0.2);
		}
		//right arrow
		if (leftPosition > containerWidth - sliderContentWidth) {
			slider.find('.arrow.right').fadeTo(0, 1.0);
		}
		else {
			slider.find('.arrow.right').fadeTo(0, 0.2);
		}
	}
	
	//add slider arrows dynamically so they only appear if js is enabled
	jQuery('.slider').prepend('<div class="arrow left">').append('<div class="arrow right">').each(function(){
		setSliderArrows(jQuery(this));
	});

	//slider arrow click
	jQuery('.slider .arrow').click(function(){
		//which slider and direction to move
		var slider = jQuery(this).closest('.slider');
		var direction;
		if (jQuery(this).hasClass('left')) {
			direction = 'left';
		}
		else if (jQuery(this).hasClass('right')) {
			direction = 'right';
		}
		//call function to move slider
		moveSlider(slider, direction);
	});
});
