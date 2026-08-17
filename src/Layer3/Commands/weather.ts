import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const weatherCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get weather information for a city.')
        .addStringOption(opt => opt.setName('city').setDescription('City name').setRequired(true)),

    async execute(interaction: ChatInputCommandInteraction) {
        const city = interaction.options.getString('city', true);

        await interaction.deferReply();

        try {
            const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
            const data = await response.json() as any;

            const current = data.current_condition[0];
            const weatherDesc = current.weatherDesc[0].value;
            const tempC = current.temp_C;
            const tempF = current.temp_F;
            const humidity = current.humidity;
            const windSpeed = current.windspeedKmph;

            const embed = new EmbedBuilder()
                .setTitle(`🌤️ Weather in ${city}`)
                .setColor('#0099ff')
                .addFields(
                    { name: 'Condition', value: weatherDesc, inline: true },
                    { name: 'Temperature', value: `${tempC}°C / ${tempF}°F`, inline: true },
                    { name: 'Humidity', value: `${humidity}%`, inline: true },
                    { name: 'Wind Speed', value: `${windSpeed} km/h`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'wttr.in' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Weather error:', error);
            await interaction.editReply('❌ Failed to fetch weather. Try again later.');
        }
    }
};
