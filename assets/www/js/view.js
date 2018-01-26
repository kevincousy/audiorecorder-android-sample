
var app = {

    SONOGRAM_WIDTH: 300,
    SONOGRAM_HEIGHT: 80,
    RECORDING_LENGTH: 30,
    INITIAL_TIMER_INTERVAL: 10,

    frequency: 15000,
    
    sonogramWidths: [],
    sonogramColours: [],

    sonogramClearColour: '#80ff80',

    lastAmplitudeUpdateTime: new Date().valueOf(),
    lastFrequenciesUpdateTime: new Date().valueOf(),
    
    initialize: function() {

        // Clear the sonogram
        
        audioRecorder.clearBuffers();

        app.clearSonogram('sonogram');
        app.clearSonogram('dynamic_sonogram');
        
        // Call the initial update of the amplitude and frequency displays
        
        setTimeout(app.updateAmplitude, app.INITIAL_TIMER_INTERVAL);
        setTimeout(app.updateFrequencies, app.INITIAL_TIMER_INTERVAL);
        
    },

    captureRecording: function() {

        // Trigger the audioRecorder to capture the recording
        
        audioRecorder.captureRecording( function(fileName) {
                                       
            // Update the filename on the display
                                       
            document.getElementById('filename').innerHTML = fileName;
                                       
            // Write the recording to the file system
                                       
            audioRecorder.writeRecording(app.RECORDING_LENGTH);
                                       
            // Generate the sonogram
                                       
            audioRecorder.writeSonogram(app.SONOGRAM_WIDTH, app.SONOGRAM_HEIGHT, app.RECORDING_LENGTH, function(sonogram) {
                                                                   
                // Replace the sonogram with the high resolution version from the plugin
                                                                   
                var image = new Image(),
                    context = document.getElementById('sonogram').getContext('2d');
                                                                   
                image.onload = function() {
                    context.drawImage(image, 0, 0);
                };
                                                                   
                image.src = 'data:image/png;base64,' + sonogram;
                                                                   
            });
                                       
        });

    },
    
    updateFrequency: function(step) {
        
        // Update the frequency display and the plugin

        app.frequency += step;
        app.frequency = Math.max(10000,Math.min(20000,app.frequency));

        audioRecorder.setHeterodyneFrequency(app.frequency);

        document.getElementById('frequency').innerHTML = app.frequency;

    },
    
    updateAmplitude: function() {

        // Calculate the timer interval from the last update

        var currentTime = new Date().valueOf(),
            timeDifference = currentTime - app.lastAmplitudeUpdateTime;
        
        app.lastAmplitudeUpdateTime = currentTime;

        // Get the scaled output

        audioRecorder.getScaledAmplitude( function(amplitude) {

            // Update the canvas

            var element = document.getElementById('amplitude'),
                context = element.getContext('2d'),
                height = element.height,
                width = element.width;

            context.fillStyle='#000000';
            context.fillRect(0, 0, width, height);
                                         
            context.fillStyle='#008800';
            context.fillRect(0, 0, width*amplitude, height);

            // Call the next update
                                         
            setTimeout(app.updateAmplitude, Math.min(500,timeDifference/2));

        });

    },
    
    clearSonogram: function(elementName) {
        
        // Draw sonogram with plain zero color
        
        var element = document.getElementById(elementName),
        context = element.getContext('2d'),
        height = element.height,
        width = element.width;
        
        context.fillStyle = app.sonogramClearColour;
        context.strokeStyle = app.sonogramClearColour;
        context.fillRect(0, 0, width, height);
        
    },

    updateFrequencies: function() {

        // Calculate the timer interval from the last update

        var currentTime = new Date().valueOf(),
            timeDifference = currentTime - app.lastFrequenciesUpdateTime;

        app.lastFrequenciesUpdateTime = currentTime;

        // Get the sonogram output

        audioRecorder.getFrequencyColours( function(colours) {
                                          
            var i, j, x, array, width, height, number = colours.length,
                element = document.getElementById('dynamic_sonogram'),
                context = element.getContext('2d');

            array = [];

            if (app.sonogramColours.length === 0) {

                for (i = 0; i < colours.length; i += 1) {
                    array.push( app.sonogramClearColour );
                }

                app.sonogramColours.push( array );
                app.sonogramWidths.push( 1000 * app.RECORDING_LENGTH );

            }

            // Add the current data

            app.sonogramColours.unshift( colours );
            app.sonogramWidths.unshift( timeDifference );

            // Draw the sonogram

            x = element.width;

            height = element.height / number;

            for (i = 0; i < app.sonogramColours.length; i += 1) {

                width = element.width * app.sonogramWidths[i] / 1000 / app.RECORDING_LENGTH;

                if (x - width < 0) {
                    width = x;
                }

                for (j = 0; j < number; j += 1) {

                    // Set the appropriate colour
                                          
                    context.fillStyle = app.sonogramColours[i][j];
                    context.strokeStyle =  app.sonogramColours[i][j];
                                          
                    // Draw the rectangle with slight shift to reduce anti-aliasing

                    context.fillRect(x - width - 0.5, (number-j-1)*height - 0.5, width + 0.5, height + 0.5);

                }

                if (x === width) {
                    break;
                }

                x -= width;

            }

            while (i + 1 < app.sonogramColours.length) {
                app.sonogramWidths.pop();
                app.sonogramColours.pop();
            }

            // Call the next update with appropriate minimum and maximum delays
                                          
            setTimeout(app.updateFrequencies, Math.max(app.RECORDING_LENGTH/app.SONOGRAM_WIDTH*1000/2,Math.min(500,timeDifference/2)));

        });

    }

};
