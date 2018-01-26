
var app = {

    SONOGRAM_WIDTH: 300,
    SONOGRAM_HEIGHT: 100,
    RECORDING_LENGTH: 30,
    INITIAL_TIMER_INTERVAL: 10,

    recording: false,
    frequency: 15000,
    recordingStartTime: 0,
    
    sonogramX: 0,
    
    lastSonogramUpdateTime: new Date().valueOf(),
    lastAmplitudeUpdateTime: new Date().valueOf(),
    lastFrequenciesUpdateTime: new Date().valueOf(),
    
    initialize: function() {

        // Clear the sonogram

        audioRecorder.clearBuffers();

        app.clearSonogram();
        
        // Call the initial update of the amplitude and frequency displays
        
        setTimeout(app.updateAmplitude, app.INITIAL_TIMER_INTERVAL);
        setTimeout(app.updateFrequencies, app.INITIAL_TIMER_INTERVAL);
        
    },

    startRecording: function() {

        if (!app.recording) {

            // Clear the sonogram

            app.clearSonogram();

            // Set up the parameters for recording
            
            app.sonogramX = 0.5;
            app.recording = true;
            app.recordingStartTime = new Date().valueOf();
            app.lastSonogramUpdateTime = app.recordingStartTime;

            // Call initial update

            setTimeout(app.updateRecordingTimer, app.INITIAL_TIMER_INTERVAL);

        }

    },

    cancelRecording: function() {

        app.recording = false;

    },

    updateRecordingTimer: function() {

        if (app.recording) {
            
            // Calculate the timer interval from the last update

            var element = document.getElementById('timer'),
                currentTime = new Date().valueOf(),
                timeDifference = app.RECORDING_LENGTH - (currentTime - app.recordingStartTime) / 1000;

            if (timeDifference < 0) {

                // Finished recording

                app.recording = false;
                element.innerHTML = '0.0';

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

                // Draw the last slice of the sonogram without repeating
                
                app.updateSonogram(currentTime, false);

            } else {

                // Update the timer and draw the next slice of the sonogram with a repeat

                element.innerHTML = timeDifference.toFixed(1);
                
                app.updateSonogram(currentTime, true);

            }

        }

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
            context.fillRect(0, height*(1-amplitude), width, height*amplitude);

            // Call the next update
                                         
            setTimeout(app.updateAmplitude, Math.min(500,timeDifference/2));

        });

    },

    updateFrequencies: function() {

        // Calculate the timer interval from the last update
        
        var currentTime = new Date().valueOf(),
            timeDifference = currentTime - app.lastFrequenciesUpdateTime;
        
        app.lastFrequenciesUpdateTime = currentTime;

        // Get the scaled output

        audioRecorder.getScaledFrequencies( function(frequencies) {

            // Update the canvas

            var i, element = document.getElementById('frequencies'),
                context = element.getContext('2d'),
                number = frequencies.length,
                height = element.height,
                width = element.width;

            context.linewidth = 2;
                                           
            context.fillStyle = '#000000';
            context.fillRect(0, 0, width, height);
                                           
            context.fillStyle = '#0000cc';
            context.strokeStyle = '#0000cc';

            for (i = 0; i < number; i += 1) {

                context.fillRect(i*width/number - 1, height*(1-frequencies[i]), width/number + 1, height*frequencies[i]);

            }

            // Call the next update with appropriate minimum and maximum delays

            setTimeout(app.updateFrequencies, Math.max(app.RECORDING_LENGTH/app.SONOGRAM_WIDTH*1000/2,Math.min(500,timeDifference/2)));

        });

    },
    
    clearSonogram: function() {

        // Draw sonogram with plain zero color
    
        var element = document.getElementById('sonogram'),
            context = element.getContext('2d'),
            height = element.height,
            width = element.width;
        
        context.fillStyle = '#80ff80';
        context.strokeStyle = '#80ff80';
        context.fillRect(0, 0, width, height);
    
    },

    updateSonogram: function(currentTime, repeat) {

        // Get the updated sonogram colours

        audioRecorder.getFrequencyColours( function(colours) {

            var width, height, timeDifference, number = colours.length,
                element = document.getElementById('sonogram'),
                context = element.getContext('2d'),
                endTime = app.recordingStartTime + app.RECORDING_LENGTH * 1000;

            if (currentTime > endTime) {
                currentTime = endTime;
            }

            // Calculate the interval from last time and size the block to draw
            
            height = element.height / number;
                      
            timeDifference = currentTime - app.lastSonogramUpdateTime;
                                          
            width = element.width * timeDifference / 1000 / app.RECORDING_LENGTH;
                                          
            app.lastSonogramUpdateTime = currentTime;
                                          
            // Draw each frequency block
                                          
            app.sonogramX -= 0.5;
                                          
            width += 0.5;

            for (j = 0; j < number; j += 1) {
                                        
                // Set the appropriate colour
                                          
                context.fillStyle = colours[j];
                context.strokeStyle = colours[j];
                                          
                // Draw the rectangle with slight shift to reduce anti-aliasing
                                          
                context.fillRect(app.sonogramX, (number-j-1)*height - 0.5, width, height + 0.5);

            }
                            
            app.sonogramX += width;

            // Call the next update if appropriate

            if (repeat) {
                                          
                setTimeout(app.updateRecordingTimer, Math.min(500,timeDifference/2));
                                          
            }

        });

    }

};
