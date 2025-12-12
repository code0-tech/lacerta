const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { AttachmentBuilder } = require('discord.js');
const Constants = require('../../data/constants');
const path = require('path');

class Chart {
    constructor(width, height) {
        this.backgroundImageFilePath = path.join(global.mainDir, 'data', 'images', Constants.IMAGES.CHART_BACKGROUND);
        this.chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

        const plugin = {
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart, args, options) => {
                const { ctx } = chart;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = '#99ffff';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        };

        // plugin cannot set background color

        this.configuration = {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: 'white'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    },
                    customCanvasBackgroundColor: { // plugin cannot set background color
                        color: 'lightGreen',
                    }
                },
                layout: {
                    padding: 20
                },
                backgroundColor: 'white', // Set the background color of the handels
                plugins: [plugin] // plugin cannot set background color
            }
        };
    }

    setType(type) {
        this.configuration.type = type;
        return this;
    }

    setLabels(labels) {
        this.configuration.data.labels = labels;
        return this;
    }

    addDataset(label, data, borderColor = 'rgb(75, 192, 192)', fill = false, tension = 0.2) {
        this.configuration.data.datasets.push({
            label: label,
            data: data,
            borderColor: borderColor,
            fill: fill,
            tension: tension
        });
        return this;
    }

    setScales(xOptions, yOptions) {
        if (xOptions) this.configuration.options.scales.x = xOptions;
        if (yOptions) this.configuration.options.scales.y = yOptions;
        return this;
    }

    async renderToBuffer() {
        return await this.chartJSNodeCanvas.renderToBuffer(this.configuration);
    }

    async getAttachment() {
        const imageBuffer = await this.renderToBuffer();
        return new AttachmentBuilder(imageBuffer, { name: Constants.DISCORD.EMBED_IMAGE_NAME.BUILDER.DEFAULT_PNG_01 });
    }

    /**
         * Send a response to an interaction.
         * @param {Interaction} interaction - The interaction object.
         * @param {MessageActionRow[]} [components] - The components to include in the message.
         * @param {boolean} [ephemeral=true] - Whether the response should be ephemeral. 
         * @param {string|null} [content=null] - The content of the response.
         * @returns {Promise<void>} - A promise that resolves when the message is sent.
         */
    async interactionResponse(interaction, components = [], ephemeral = true, content = null, embeds = []) {
        try {
            const responseOptions = {
                content,
                embeds: embeds,
                components,
                files: [await this.getAttachment()],
                ephemeral
            };

            let interactionReply = undefined;

            try {
                interactionReply = await interaction.editReply(responseOptions);
            } catch (error) {
                if (error.code === 50027) {
                    interactionReply = null;
                } else {
                    throw error;
                }
            }

            return interactionReply;
        } catch (error) {
            console.error(`Error sending Chart interaction response: ${error.message}`);
            throw error;
        }
    }
};

module.exports = Chart;