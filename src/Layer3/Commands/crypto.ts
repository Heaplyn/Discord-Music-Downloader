import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';

export const cryptoCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('crypto')
        .setDescription('Get the current price of a cryptocurrency.')
        .addStringOption(opt =>
            opt.setName('coin')
               .setDescription('The cryptocurrency to check')
               .setRequired(true)
               .addChoices(
                   { name: 'Bitcoin (BTC)', value: 'bitcoin' },
                   { name: 'Ethereum (ETH)', value: 'ethereum' },
                   { name: 'Dogecoin (DOGE)', value: 'dogecoin' },
                   { name: 'Solana (SOL)', value: 'solana' },
                   { name: 'Cardano (ADA)', value: 'cardano' }
               )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const coinId = interaction.options.getString('coin', true);

        await interaction.deferReply();

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`);
            if (!response.ok) {
                throw new Error(`CoinGecko responded with status ${response.status}`);
            }

            const data = await response.json() as any;
            if (!data[coinId]) {
                await interaction.editReply(`❌ Could not find price data for **${coinId}**.`);
                return;
            }

            const price = data[coinId].usd;
            const change = data[coinId].usd_24h_change;
            
            const coinName = coinId.charAt(0).toUpperCase() + coinId.slice(1);
            const changeText = change !== undefined ? `${change >= 0 ? '📈 +' : '📉 '}${change.toFixed(2)}%` : 'N/A';
            const color = change >= 0 ? '#2ecc71' : '#e74c3c';

            const embed = new EmbedBuilder()
                .setTitle(`🪙 ${coinName} Price Status`)
                .setColor(color)
                .addFields(
                    { name: 'Current Price', value: `$${price.toLocaleString()}`, inline: true },
                    { name: '24h Change', value: changeText, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by CoinGecko' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Crypto error:', error);
            await interaction.editReply('❌ Failed to fetch cryptocurrency data. Try again later.');
        }
    }
};
