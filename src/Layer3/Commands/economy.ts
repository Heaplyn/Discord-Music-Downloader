import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../Layer0/Command.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../../data');
const economyFile = path.join(dataDir, 'economy.json');

interface Profile {
    wallet: number;
    bank: number;
    lastDaily?: number;
    lastBeg?: number;
    lastWork?: number;
    lastRob?: number;
}

interface EconomyData {
    [userId: string]: Profile;
}

function getEconomy(): EconomyData {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(economyFile)) {
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(economyFile, 'utf-8'));
    } catch {
        return {};
    }
}

function saveEconomy(data: EconomyData) {
    fs.writeFileSync(economyFile, JSON.stringify(data, null, 2));
}

function getProfile(userId: string, data: EconomyData): Profile {
    if (!data[userId]) {
        data[userId] = { wallet: 0, bank: 0 };
    }
    return data[userId];
}

const JOBS = [
    { title: 'Discord Moderator', salary: [100, 200], failChance: 0.05, successMsg: 'You moderated a server and earned', failMsg: 'You got demoted from being a moderator and earned nothing.' },
    { title: 'Software Engineer', salary: [150, 300], failChance: 0.1, successMsg: 'You fixed a production bug and earned', failMsg: 'Your code crashed production and you got fined 50 coins instead.' },
    { title: 'Meme Maker', salary: [50, 150], failChance: 0, successMsg: 'Your meme went viral on Reddit! You earned', failMsg: '' },
    { title: 'Fast Food Worker', salary: [80, 120], failChance: 0, successMsg: 'You flipped burgers at McRonalds and earned', failMsg: '' },
    { title: 'Roblox Developer', salary: [120, 250], failChance: 0.05, successMsg: 'You created a game pass and earned', failMsg: 'Your game was deleted for policy violation. You made nothing.' }
];

const BEG_MESSAGES = [
    'A kind stranger handed you {coins} coins.',
    'You found {coins} coins in the couch cushion.',
    'You sang on the street corner and someone threw {coins} coins at you.',
    'Your grandma gave you {coins} coins for being a good kid.',
    'You begged on the street and a generous developer gave you {coins} coins.'
];

export const economyCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('Global economy system commands.')
        .addSubcommand(sub =>
            sub.setName('balance')
               .setDescription('Check yours or another user\'s balance.')
               .addUserOption(opt => opt.setName('user').setDescription('The user to check.'))
        )
        .addSubcommand(sub =>
            sub.setName('daily')
               .setDescription('Claim your daily 500 coins.')
        )
        .addSubcommand(sub =>
            sub.setName('beg')
               .setDescription('Beg for some coins (cooldown: 30s).')
        )
        .addSubcommand(sub =>
            sub.setName('work')
               .setDescription('Work a shift to earn coins (cooldown: 5m).')
        )
        .addSubcommand(sub =>
            sub.setName('deposit')
               .setDescription('Deposit coins from wallet into the bank.')
               .addStringOption(opt => opt.setName('amount').setDescription('Amount to deposit or "all"').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('withdraw')
               .setDescription('Withdraw coins from the bank into your wallet.')
               .addStringOption(opt => opt.setName('amount').setDescription('Amount to withdraw or "all"').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('pay')
               .setDescription('Pay coins to another user.')
               .addUserOption(opt => opt.setName('user').setDescription('User to pay').setRequired(true))
               .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to pay').setRequired(true).setMinValue(1))
        )
        .addSubcommand(sub =>
            sub.setName('rob')
               .setDescription('Attempt to rob another user (cooldown: 10m).')
               .addUserOption(opt => opt.setName('user').setDescription('User to rob').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('slots')
               .setDescription('Bet your coins in the slot machine (cooldown: 5s).')
               .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(1))
        )
        .addSubcommand(sub =>
            sub.setName('leaderboard')
               .setDescription('View the top 10 richest users.')
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const economy = getEconomy();

        if (subcommand === 'balance') {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            const profile = getProfile(targetUser.id, economy);
            
            const embed = new EmbedBuilder()
                .setTitle(`💰 Balance for ${targetUser.username}`)
                .setColor('#2ecc71')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: '👛 Wallet', value: `${profile.wallet} coins`, inline: true },
                    { name: '🏦 Bank', value: `${profile.bank} coins`, inline: true },
                    { name: '📊 Total Balance', value: `${profile.wallet + profile.bank} coins`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'daily') {
            const profile = getProfile(userId, economy);
            const cooldown = 24 * 60 * 60 * 1000;
            const lastDaily = profile.lastDaily || 0;
            const now = Date.now();

            if (now - lastDaily < cooldown) {
                const remaining = cooldown - (now - lastDaily);
                const hrs = Math.floor(remaining / (3600 * 1000));
                const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
                const secs = Math.floor((remaining % (60 * 1000)) / 1000);
                await interaction.reply({ content: `⏳ You already claimed your daily reward! Try again in **${hrs}h ${mins}m ${secs}s**.`, ephemeral: true });
                return;
            }

            profile.wallet += 500;
            profile.lastDaily = now;
            saveEconomy(economy);

            await interaction.reply(`🎁 You claimed your daily reward and received **500** coins!`);
        }
        else if (subcommand === 'beg') {
            const profile = getProfile(userId, economy);
            const cooldown = 30 * 1000;
            const lastBeg = profile.lastBeg || 0;
            const now = Date.now();

            if (now - lastBeg < cooldown) {
                const remaining = Math.ceil((cooldown - (now - lastBeg)) / 1000);
                await interaction.reply({ content: `⏳ Cooldown active. Wait **${remaining}s** before begging again.`, ephemeral: true });
                return;
            }

            profile.lastBeg = now;
            const success = Math.random() > 0.2; // 80% chance of success
            if (!success) {
                saveEconomy(economy);
                await interaction.reply(`😞 Nobody gave you anything. Better luck next time!`);
                return;
            }

            const coins = Math.floor(Math.random() * 91) + 10; // 10 to 100 coins
            profile.wallet += coins;
            saveEconomy(economy);

            const baseMsg = BEG_MESSAGES[Math.floor(Math.random() * BEG_MESSAGES.length)];
            await interaction.reply(baseMsg.replace('{coins}', coins.toString()));
        }
        else if (subcommand === 'work') {
            const profile = getProfile(userId, economy);
            const cooldown = 5 * 60 * 1000;
            const lastWork = profile.lastWork || 0;
            const now = Date.now();

            if (now - lastWork < cooldown) {
                const remaining = cooldown - (now - lastWork);
                const mins = Math.floor(remaining / (60 * 1000));
                const secs = Math.floor((remaining % (60 * 1000)) / 1000);
                await interaction.reply({ content: `⏳ Cooldown active. You can work again in **${mins}m ${secs}s**.`, ephemeral: true });
                return;
            }

            profile.lastWork = now;
            const job = JOBS[Math.floor(Math.random() * JOBS.length)];
            const failed = job.failChance > 0 && Math.random() < job.failChance;

            if (failed) {
                if (job.title === 'Software Engineer') {
                    const penalty = 50;
                    profile.wallet = Math.max(0, profile.wallet - penalty);
                    saveEconomy(economy);
                    await interaction.reply(`🛠️ **[${job.title}]** ${job.failMsg}`);
                    return;
                }
                saveEconomy(economy);
                await interaction.reply(`🛠️ **[${job.title}]** ${job.failMsg}`);
                return;
            }

            const earned = Math.floor(Math.random() * (job.salary[1] - job.salary[0] + 1)) + job.salary[0];
            profile.wallet += earned;
            saveEconomy(economy);

            await interaction.reply(`🛠️ **[${job.title}]** ${job.successMsg} **${earned}** coins!`);
        }
        else if (subcommand === 'deposit') {
            const profile = getProfile(userId, economy);
            const amountStr = interaction.options.getString('amount', true).toLowerCase();

            let amountToDep = 0;
            if (amountStr === 'all') {
                amountToDep = profile.wallet;
            } else {
                amountToDep = parseInt(amountStr);
                if (isNaN(amountToDep) || amountToDep <= 0) {
                    await interaction.reply({ content: `❌ Invalid amount to deposit. Please enter a positive number or "all".`, ephemeral: true });
                    return;
                }
            }

            if (amountToDep === 0) {
                await interaction.reply({ content: `❌ You have no coins in your wallet to deposit!`, ephemeral: true });
                return;
            }

            if (profile.wallet < amountToDep) {
                await interaction.reply({ content: `❌ You only have **${profile.wallet}** coins in your wallet!`, ephemeral: true });
                return;
            }

            profile.wallet -= amountToDep;
            profile.bank += amountToDep;
            saveEconomy(economy);

            await interaction.reply(`🏦 Successfully deposited **${amountToDep}** coins into your bank account.`);
        }
        else if (subcommand === 'withdraw') {
            const profile = getProfile(userId, economy);
            const amountStr = interaction.options.getString('amount', true).toLowerCase();

            let amountToWith = 0;
            if (amountStr === 'all') {
                amountToWith = profile.bank;
            } else {
                amountToWith = parseInt(amountStr);
                if (isNaN(amountToWith) || amountToWith <= 0) {
                    await interaction.reply({ content: `❌ Invalid amount to withdraw. Please enter a positive number or "all".`, ephemeral: true });
                    return;
                }
            }

            if (amountToWith === 0) {
                await interaction.reply({ content: `❌ You have no coins in your bank to withdraw!`, ephemeral: true });
                return;
            }

            if (profile.bank < amountToWith) {
                await interaction.reply({ content: `❌ You only have **${profile.bank}** coins in your bank!`, ephemeral: true });
                return;
            }

            profile.bank -= amountToWith;
            profile.wallet += amountToWith;
            saveEconomy(economy);

            await interaction.reply(`🏦 Successfully withdrew **${amountToWith}** coins to your wallet.`);
        }
        else if (subcommand === 'pay') {
            const targetUser = interaction.options.getUser('user', true);
            const amount = interaction.options.getInteger('amount', true);

            if (targetUser.id === userId) {
                await interaction.reply({ content: `❌ You cannot pay yourself!`, ephemeral: true });
                return;
            }
            if (targetUser.bot) {
                await interaction.reply({ content: `❌ You cannot pay bots!`, ephemeral: true });
                return;
            }

            const senderProfile = getProfile(userId, economy);
            const receiverProfile = getProfile(targetUser.id, economy);

            if (senderProfile.wallet < amount) {
                await interaction.reply({ content: `❌ You only have **${senderProfile.wallet}** coins in your wallet.`, ephemeral: true });
                return;
            }

            senderProfile.wallet -= amount;
            receiverProfile.wallet += amount;
            saveEconomy(economy);

            await interaction.reply(`🤝 Paid **${amount}** coins to ${targetUser}.`);
        }
        else if (subcommand === 'rob') {
            const targetUser = interaction.options.getUser('user', true);
            if (targetUser.id === userId) {
                await interaction.reply({ content: `❌ You cannot rob yourself!`, ephemeral: true });
                return;
            }
            if (targetUser.bot) {
                await interaction.reply({ content: `❌ You cannot rob bots!`, ephemeral: true });
                return;
            }

            const profile = getProfile(userId, economy);
            const targetProfile = getProfile(targetUser.id, economy);

            if (profile.wallet < 100) {
                await interaction.reply({ content: `❌ You need at least **100** coins in your wallet to rob someone.`, ephemeral: true });
                return;
            }
            if (targetProfile.wallet < 100) {
                await interaction.reply({ content: `❌ The target does not have at least **100** coins in their wallet. It's not worth it!`, ephemeral: true });
                return;
            }

            const cooldown = 10 * 60 * 1000;
            const lastRob = profile.lastRob || 0;
            const now = Date.now();

            if (now - lastRob < cooldown) {
                const remaining = cooldown - (now - lastRob);
                const mins = Math.floor(remaining / (60 * 1000));
                const secs = Math.floor((remaining % (60 * 1000)) / 1000);
                await interaction.reply({ content: `⏳ Cooldown active. You can rob again in **${mins}m ${secs}s**.`, ephemeral: true });
                return;
            }

            profile.lastRob = now;
            const success = Math.random() > 0.5;

            if (success) {
                const percentage = Math.random() * 0.4 + 0.1; // 10% to 50%
                const stolen = Math.floor(targetProfile.wallet * percentage);
                
                profile.wallet += stolen;
                targetProfile.wallet -= stolen;
                saveEconomy(economy);

                await interaction.reply(`🕵️ You successfully robbed ${targetUser} and took **${stolen}** coins!`);
            } else {
                const fine = Math.floor(Math.random() * 401) + 100; // 100 to 500
                const actualFine = Math.min(profile.wallet, fine);
                
                profile.wallet -= actualFine;
                saveEconomy(economy);

                await interaction.reply(`👮 You got caught trying to rob ${targetUser}! You were fined **${actualFine}** coins.`);
            }
        }
        else if (subcommand === 'slots') {
            const bet = interaction.options.getInteger('bet', true);
            const profile = getProfile(userId, economy);

            if (profile.wallet < bet) {
                await interaction.reply({ content: `❌ You do not have enough coins in your wallet! Wallet: **${profile.wallet}** coins.`, ephemeral: true });
                return;
            }

            const items = ['🍒', '🍋', '🍇', '💎', '⭐', '🍎'];
            const slot1 = items[Math.floor(Math.random() * items.length)];
            const slot2 = items[Math.floor(Math.random() * items.length)];
            const slot3 = items[Math.floor(Math.random() * items.length)];

            let multiplier = 0;
            let winText = '';

            if (slot1 === slot2 && slot2 === slot3) {
                multiplier = 5;
                winText = `🎰 **JACKPOT!** 3 matching symbols! You win **5x** your bet!`;
            } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
                multiplier = 2;
                winText = `🎰 **Nice!** 2 matching symbols! You win **2x** your bet!`;
            } else {
                multiplier = 0;
                winText = `🎰 **Aww...** No matches. You lost your bet.`;
            }

            if (multiplier > 0) {
                const winnings = bet * multiplier;
                profile.wallet += (winnings - bet); // Add net winnings
            } else {
                profile.wallet -= bet;
            }

            saveEconomy(economy);

            const embed = new EmbedBuilder()
                .setTitle('🎰 Slot Machine')
                .setColor(multiplier > 0 ? '#f1c40f' : '#e74c3c')
                .setDescription(`[ ${slot1} | ${slot2} | ${slot3} ]\n\n${winText}`)
                .addFields({ name: '👛 Wallet Balance', value: `${profile.wallet} coins` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
        else if (subcommand === 'leaderboard') {
            // Sort economy users by total balance (wallet + bank)
            const sorted = Object.entries(economy)
                .map(([id, p]) => ({ id, total: p.wallet + p.bank }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 10);

            if (sorted.length === 0) {
                await interaction.reply(`📊 Economy is currently empty!`);
                return;
            }

            await interaction.deferReply();

            const embed = new EmbedBuilder()
                .setTitle('🏆 Global Economy Leaderboard')
                .setColor('#f39c12')
                .setTimestamp();

            let lbText = '';
            for (let i = 0; i < sorted.length; i++) {
                try {
                    const user = await interaction.client.users.fetch(sorted[i].id);
                    lbText += `**${i + 1}.** ${user.tag} — **${sorted[i].total}** coins\n`;
                } catch {
                    lbText += `**${i + 1}.** UserID \`${sorted[i].id}\` — **${sorted[i].total}** coins\n`;
                }
            }

            embed.setDescription(lbText);
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
