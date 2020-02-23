const AQ_ZONE_ID = 3023;
const TRAVAN_TEMPLATE_ID = 1000;
const KASHIR_TEMPLATE_ID = 2000;

const QUAD_SWIPES_IDS = [2113, 2114];

const CHAOS_ID = 98850056;
const CHAOS_DURATION = 7000;

const INVISIBILITY_ID = 98000030;
const INVISIBILITY_DURATION = 6000;
const INVISIBILITY_DELAY = 1000;

const DEBUG = false;
// Extra mechs:
// - no purple circles
// - no hp bars
// - no mech messages
// - invisible party members on Begone mech


class AQEM
{
    enabled = false;
    chaosRunning = false;
    targeting = false;
    travan_gameId = 0;
    kashir_gameId = 0;
    partyMembersList = null;
    
    constructor(mod)
    {
        mod.hook("S_PARTY_MEMBER_LIST", 7, ev =>
        {
            this.partyMembersList = ev;
        });
        mod.hook("S_LOAD_TOPO", 3, ev =>
        {
            this.enabled = ev.zone === AQ_ZONE_ID;
            this.travan_gameId = 0;
            this.kashir_gameId = 0;
        });
        mod.hook("S_RETURN_TO_LOBBY", 1, ev =>
        {
            this.enabled = false;
        });

        mod.hook("S_SPAWN_NPC", 11, ev =>
        {
            if (!this.enabled) return;
            if (ev.huntingZoneId !== AQ_ZONE_ID) return;
            if (ev.templateId === TRAVAN_TEMPLATE_ID)
            {
                this.travan_gameId = ev.gameId;
                if (DEBUG) mod.log(`Set Travan id to ${this.travan_gameId}`);
            }
            else if (ev.templateId === KASHIR_TEMPLATE_ID && this.kashir_gameId !== 0)
            {
                this.kashir_gameId = ev.gameId;
                if (DEBUG) mod.log(`Set Kashir id to ${this.kashir_gameId}`);
            }
        });

        mod.hook("S_DESPAWN_NPC", 3, ev =>
        {
            if (!this.enabled) return;
            if (ev.gameId === this.travan_gameId) this.travan_gameId = 0;
            else if (ev.gameId === this.kashir_gameId) this.kashir_gameId = 0;
        });

        mod.hook("S_USER_EFFECT", 1, ev =>
        {
            // remove purple circles
            if (!this.enabled) return;
            if (ev.circle === 3)
            {
                this.targeting = ev.operation === 1;
                return false;
            }
        });

        mod.hook("S_QUEST_BALLOON", 1, ev =>
        {
            // make party members invisible on Begone
            if (ev.message.indexOf('@monsterBehavior:30231002') !== -1)
            {
                this.partyMembersList.members.forEach(member =>
                {
                    mod.setTimeout(() =>
                    {
                        mod.send("S_ABNORMALITY_BEGIN", 4, {
                            target: member.gameId,
                            source: 0,
                            id: INVISIBILITY_ID,
                            stacks: 1,
                            duration: INVISIBILITY_DURATION
                        });
                    }, INVISIBILITY_DELAY);
                    mod.setTimeout(() =>
                    {
                        mod.send("S_ABNORMALITY_END", 1, {
                            target: member.gameId,
                            id: INVISIBILITY_ID,
                        });
                    }, INVISIBILITY_DURATION + INVISIBILITY_DELAY);
                });
            }
            // block messages
            if (ev.message.indexOf('@monsterBehavior:30231000') !== -1 || // colors 1
                ev.message.indexOf('@monsterBehavior:30231001') !== -1 || // colors 2
                ev.message.indexOf('@monsterBehavior:30231002') !== -1 || // begone
                ev.message.indexOf('@monsterBehavior:30232000') !== -1    // hunt
            ) return false;
        });

        mod.hook("S_SHOW_HP", 3, ev =>
        {
            // hide hp bars
            return !this.enabled;
        })
    }
}

module.exports = AQEM;

