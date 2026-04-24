// ============== CAETO'S PLAYBOOK ==============
// Plain-English help for a first-time Monk (Way of the Intelligent Hand).
// All references are tailored to Caeto's level-4 build.

window.PLAYBOOK = {

  // --------------------------------------------------
  //  TURN COACH — What can I do on my turn?
  // --------------------------------------------------
  turnCoach: {
    intro: "On each of your turns you get FOUR 'slots': Movement, one Action, one Bonus Action, and (outside your turn) one Reaction. You don't have to use them all. Focus Points (FP) are your fuel for Monk tricks.",

    actions: [
      {
        name: "Attack — Unarmed",
        slot: "Action",
        source: "yours",
        cost: "Free",
        tldr: "d20 + INT vs AC; 1d6 bludgeoning on hit.",
        what: "Swing at someone within 5 ft. Roll d20 + INT mod (Intelligent Strikes) vs their AC. On a hit, 1d6 bludgeoning damage.",
        when: "Your bread-and-butter. Safe, cheap, and always available.",
        tip: "Because you're a Monk you get a FREE bonus-action unarmed strike after you take the Attack action — so a basic turn is already TWO punches."
      },
      {
        name: "Attack — Velthar Steel Hair Needles",
        slot: "Action",
        source: "yours",
        cost: "Free",
        tldr: "+4 to hit, 1d8 piercing; climb walls without Acrobatics.",
        what: "+4 to hit, 1d8 piercing. These are your 'real' weapon. Also let you scale walls without rolling Acrobatics.",
        when: "When 1d8 matters more than the bonus damage-type tricks of unarmed. Also when climbing/terrain is in play.",
        tip: "Needles are piercing — good vs creatures resistant to bludgeoning (skeletons, etc.)."
      },
      {
        name: "Ring of Discernment",
        slot: "Action",
        source: "yours",
        cost: "7 HP · 3/day",
        tldr: "Slide ring after a statement. Cold = lie, warm = truth.",
        what: "Slide your finger on the ring; it slices you and draws blood. Cold = the last spoken statement is a lie. Warm = truth.",
        when: "Social scenes where you strongly suspect deception — interrogations, negotiations, any time someone's story smells wrong.",
        tip: "Resets on a Long Rest. 7 HP is a big chunk of your 28 — don't use it on trivial lies. Save it for 'is this person about to betray us?'"
      },
      {
        name: "Dodge",
        slot: "Action",
        source: "universal",
        cost: "Free",
        tldr: "Attackers have disadvantage; advantage on DEX saves until next turn.",
        what: "Attackers against you have disadvantage; you have advantage on DEX saves until your next turn.",
        when: "You're out of Focus and need to survive a round. Also strong when you're the 'tank' distracting an enemy from a teammate."
      },
      {
        name: "Dash",
        slot: "Action",
        source: "universal",
        cost: "Free",
        tldr: "Double your movement this turn (40 → 80 ft).",
        what: "Double your movement for this turn (40 → 80 ft).",
        when: "You need to cover real distance — you can Dash as an Action AND use Step of the Wind for FOUR times your speed in one turn (4 × 40 = 160 ft)."
      },
      {
        name: "Disengage",
        slot: "Action",
        source: "universal",
        cost: "Free",
        tldr: "Move without triggering opportunity attacks.",
        what: "Move without triggering opportunity attacks.",
        when: "Almost never — Patient Defense does this as a bonus action for free. Only useful if you already used your bonus on something else."
      },
      {
        name: "Help",
        slot: "Action",
        source: "universal",
        cost: "Free",
        tldr: "Give an ally advantage on their next attack or ability check.",
        what: "Grant an ally advantage on their next attack against a target within 5 ft of you, OR help them with an ability check.",
        when: "You're low on options, your party's heavy hitter needs a boost, or it's a clutch skill check moment."
      },
      {
        name: "Hide",
        slot: "Action",
        source: "universal",
        cost: "Free",
        tldr: "Stealth check vs enemy Perception.",
        what: "Make a Stealth check (+1) vs enemies' Perception.",
        when: "When you have cover/concealment. A hidden attacker gets advantage on their next attack."
      },
      {
        name: "Ready",
        slot: "Action",
        source: "universal",
        cost: "Free",
        tldr: "Prepare an action to trigger on a condition (uses your Reaction).",
        what: "Prepare a specific Action to trigger on a condition ('when the door opens, I throw a needle'). Uses your Reaction to execute.",
        when: "Ambushes, doorways, or when you need to go LAST on purpose."
      },
      {
        name: "Search",
        slot: "Action",
        source: "universal",
        cost: "Free",
        tldr: "Perception or Investigation check to find something specific.",
        what: "Perception or Investigation check to find something specific.",
        when: "Traps, hidden doors, lost items — when 'I look around' isn't enough."
      },
      {
        name: "Bonus Unarmed Strike",
        slot: "Bonus Action",
        source: "yours",
        cost: "Free",
        tldr: "One free extra Unarmed Strike after your Attack action.",
        what: "After you take the Attack action with an unarmed strike or a Monk weapon, you can make one Unarmed Strike as a Bonus Action.",
        when: "Every turn you Attack — it's free damage. Skip only if you need your Bonus for Flurry, Patient Defense, or Step of the Wind.",
        tip: "No FP cost, no decision needed. This is why a basic Caeto turn is already two strikes."
      },
      {
        name: "Flurry of Blows",
        slot: "Bonus Action",
        source: "yours",
        cost: "1 FP",
        tldr: "Two Unarmed Strikes; each hit triggers Open Hand (prone, shove, or no reactions).",
        what: "Make TWO unarmed strikes as a bonus action (instead of your one free one). On each HIT, use Open Hand Technique to impose: (a) knock prone, (b) shove 15 ft, or (c) the target can't take Reactions until end of your next turn.",
        when: "You want to stack damage, OR you need to control a specific enemy (keep them from moving, running, or triggering opportunity attacks).",
        tip: "'No Reactions' is the sleeper option — it lets your allies disengage and move without getting hit."
      },
      {
        name: "Patient Defense",
        slot: "Bonus Action",
        source: "yours",
        cost: "Free / 1 FP",
        tldr: "Bonus-action Disengage; pay 1 FP to also Dodge.",
        what: "FREE: Disengage (move without opportunity attacks). 1 FP: Disengage AND Dodge (attackers roll against you with disadvantage until your next turn).",
        when: "You're getting hit too much, someone scary is staring you down, or you want to peel away from a melee without eating a parting shot.",
        tip: "Paying the FP is worth it in boss fights — halving their hit rate for a round is huge."
      },
      {
        name: "Step of the Wind",
        slot: "Bonus Action",
        source: "yours",
        cost: "Free / 1 FP",
        tldr: "Bonus-action Dash; pay 1 FP to also Disengage and double jump distance.",
        what: "FREE: Dash (double your movement this turn — 40 → 80 ft). 1 FP: Dash AND Disengage; jump distance is also doubled this turn.",
        when: "Closing distance, chasing a runner, crossing a gap, or escaping a bad spot safely.",
        tip: "Your speed is already boosted by Unarmored Movement (+10 ft). A Step of the Wind turn can cover enormous ground."
      }
    ],

    reactions: [
      {
        name: "Deflect Attacks",
        source: "yours",
        cost: "Reaction",
        tldr: "Reduce a physical hit by 1d10+5; if reduced to 0, 1 FP to redirect.",
        what: "When an attack HITS you with bludgeoning, piercing, or slashing damage, use your Reaction to reduce it by 1d10 + DEX (+1) + Monk level (4) = 1d10 + 5. If you reduce it to 0, you can spend 1 FP to REDIRECT: pick a target within 5 ft (melee) or 60 ft (ranged, not behind full cover). They make a DEX save or take 2 × Martial Arts die (2d6) + DEX mod (+1) of the same damage type.",
        when: "ANY TIME you get hit by a physical attack that connects. It's almost always worth it — you're burning a Reaction you probably weren't using anyway.",
        tip: "A big hit? Deflect it. A small hit? Deflect it anyway — it might go to 0 and let you counter-punch."
      },
      {
        name: "Slow Fall",
        source: "yours",
        cost: "Reaction",
        tldr: "Reduce fall damage by 5 × Monk level = 20 HP.",
        what: "When you fall, use your Reaction to reduce damage by 5 × Monk level = 20 HP.",
        when: "Any fall. Free HP. Costs nothing."
      },
      {
        name: "Opportunity Attack",
        source: "universal",
        cost: "Reaction",
        tldr: "One melee attack when a creature leaves your reach without Disengaging.",
        what: "When a creature leaves your reach without Disengaging, you can use your Reaction to make ONE melee attack against them.",
        when: "They're running and they didn't Disengage. Punish them."
      },
      {
        name: "Ready-triggered action",
        source: "universal",
        cost: "Reaction",
        tldr: "Fires the action you prepared with Ready.",
        what: "If you used Ready, your Reaction fires the prepared action.",
        when: "Only if you planned ahead with Ready."
      }
    ],

    movementNote: "Your speed is 30 ft + 10 ft (Unarmored Movement) = 40 ft. You can split movement before and after your Action/Bonus. You can stand up from Prone (costs half your speed). You can move along vertical surfaces with your Velthar Needles without needing Acrobatics.",

    bonusActionNote: "MONK RULE: After you take the Attack action with an unarmed strike OR a monk weapon, you get ONE free bonus-action unarmed strike. This is separate from Flurry of Blows (which uses 1 FP for TWO strikes instead of one)."
  },

  // --------------------------------------------------
  //  SITUATION HELPER
  // --------------------------------------------------
  situations: [
    {
      id: "tookBigHit",
      label: "I just took a big hit",
      emoji: "💥",
      headline: "Deflect Attacks — knock 1d10+5 off. Almost always worth it.",
      plays: [
        "USE YOUR REACTION: Deflect Attacks. 1d10 + 5 off the damage. Almost always worth it.",
        "Next turn, open with Patient Defense (1 FP) — attackers have disadvantage and you're also disengaged. Breathing room.",
        "If you're below ~10 HP, consider Step of the Wind to get OUT of reach. Dying monk = no monk."
      ]
    },
    {
      id: "outnumbered",
      label: "I'm surrounded / outnumbered",
      emoji: "⚔️",
      headline: "Flurry on the toughest; Open Hand knock PRONE to swing the fight.",
      plays: [
        "Flurry of Blows (1 FP) on the toughest one, use Open Hand to KNOCK PRONE — now the others have disadvantage vs you and advantage for your team.",
        "Alternatively, use Open Hand option (c) NO REACTIONS on the biggest threat, then move out — they can't opportunity-attack.",
        "If it's dire: Step of the Wind (1 FP) to Disengage + Dash out of the kill zone."
      ]
    },
    {
      id: "closeDistance",
      label: "I need to close distance FAST",
      emoji: "🏃",
      headline: "Action-Dash + Step of the Wind = 160 ft in one turn.",
      plays: [
        "Dash (Action) + Step of the Wind (Bonus, free). That's 4 × 40 ft = 160 ft in one turn.",
        "Use Velthar Needles to scale walls/cliffs without Acrobatics checks.",
        "If jumping is involved, Step of the Wind's 1 FP version DOUBLES jump distance."
      ]
    },
    {
      id: "outOfReach",
      label: "Enemy is at range and I can't reach them",
      emoji: "🎯",
      headline: "Throw a Needle, or close the gap with Dash + Step of the Wind.",
      plays: [
        "Throw a Velthar Needle — but check distance with your DM; they're primarily melee.",
        "If you have Deflect Attacks available and they're a ranged attacker, let them hit you, deflect to 0, then REDIRECT 2d6 + 1 back at them (up to 60 ft).",
        "Close the gap: Dash + Step of the Wind = 4 × 40 = 160 ft in one turn."
      ]
    },
    {
      id: "protectAlly",
      label: "I need to protect an ally",
      emoji: "🛡️",
      headline: "Flurry + Open Hand SHOVE to push the enemy 15 ft off your ally.",
      plays: [
        "Step between them and the threat. Use Flurry with Open Hand SHOVE to push the enemy 15 ft away from your ally.",
        "Open Hand 'no reactions' on the enemy means your ally can disengage and escape freely.",
        "Ready an attack triggered on 'if they touch my ally' — your Reaction fires immediately."
      ]
    },
    {
      id: "socialTension",
      label: "Social encounter / negotiation",
      emoji: "💬",
      headline: "Lead with Persuasion (+5). You're the talker.",
      plays: [
        "Lead with Persuasion (+5 — your highest). You're the talker.",
        "For a read on the room: Insight (+4). Great before you commit to a position.",
        "If you suspect outright lying on a high-stakes claim: Ring of Discernment (7 HP, 3/day). Save it for the claim that actually matters.",
        "Remember your levers: you run Golden Basin Goods. You can offer shipping routes, writs of value, or Osmere coffee/rope/iron (up to 500k of each, resets per Kingdom)."
      ]
    },
    {
      id: "suspectLie",
      label: "Someone might be lying",
      emoji: "👁️",
      headline: "Insight first (+4, free). Ring of Discernment only if stakes are high.",
      plays: [
        "Step one: Insight check (+4). Trust your read first — it's free.",
        "Step two (if stakes are high and you're still unsure): Ring of Discernment. Ask them to repeat the claim, then use the ring. Cold = lie, warm = truth.",
        "History/Culture (+4) helps you cross-check against known facts of their Kingdom or House."
      ]
    },
    {
      id: "scouting",
      label: "Stealth / scouting / hidden approach",
      emoji: "🌑",
      headline: "Let the rogue lead — your Stealth is only +1. Use vertical routes.",
      plays: [
        "Stealth is only +1. You're not a rogue — if the party has one, let them lead.",
        "Your Velthar Needles let you go OVER obstacles (walls, cliffs) without Acrobatics rolls — use vertical approaches.",
        "Step of the Wind (free bonus Dash) doubles your speed to 80 ft — cross open ground in fewer 'exposed' turns."
      ]
    },
    {
      id: "lowHP",
      label: "I'm low on HP",
      emoji: "❤️‍🩹",
      headline: "Short Rest if possible; otherwise Patient Defense + Deflect every hit.",
      plays: [
        "Short Rest if you can — it's not a heal, but it restores your Focus Points. (DM will say when that's possible.)",
        "In combat, Patient Defense + stay at range of a tanky ally. Use Deflect on every incoming hit.",
        "Uncanny Metabolism (once per long rest): when you roll Initiative at the start of a NEW fight, regain all FP and roll d6+4 HP. Don't trigger it if you're already topped up."
      ]
    },
    {
      id: "newKingdom",
      label: "Just traveled to a new Kingdom",
      emoji: "🏰",
      headline: "Budget resets: 500k coffee, rope, iron are fresh.",
      plays: [
        "Your negotiation budget RESETS — 500k coffee, 500k rope, 500k iron are fresh.",
        "Check the Kingdoms tab: is this one of your six advantage-picks for History/Culture checks?",
        "Jeffrey is based in your home port (Pendant Coast). If you need logistics support here, you're making the call yourself — or you send word back home."
      ]
    },
    {
      id: "initiative",
      label: "Combat just started (roll initiative)",
      emoji: "⚡",
      headline: "Uncanny Metabolism if low on FP/HP. Then close + Flurry the biggest threat.",
      plays: [
        "CONSIDER Uncanny Metabolism: regain all FP + heal 1d6+4 HP. Once per long rest. If you already have full FP and HP, skip it.",
        "First turn plan: close distance (Step of the Wind if needed), open with Flurry of Blows on the biggest threat.",
        "Open Hand choice depends on the fight: PRONE if allies are melee (they get advantage), SHOVE if you need space, NO REACTIONS if allies need to move."
      ]
    }
  ],

  // --------------------------------------------------
  //  ABILITY EXPLANATIONS (inline tooltips)
  // --------------------------------------------------
  abilityDetails: {
    "Unarmored Movement": {
      plain: "You move faster than normal — 40 ft per turn instead of 30 — as long as you're not wearing armor or holding a shield (you never do either, you're a Monk).",
      whenItMatters: "Every turn. Especially when chasing, fleeing, or repositioning.",
    },
    "Uncanny Metabolism": {
      plain: "Once per day (once per Long Rest), when you roll initiative at the start of combat, you can refill ALL your Focus Points AND heal 1d6 + 4 HP. It's free — it doesn't take your action.",
      whenItMatters: "Start of a tough fight where you're already low on FP or HP. If you're full on both, skip it — you'd waste the charge.",
    },
    "Deflect Attacks": {
      plain: "When an attack HITS you with bludgeoning, piercing, or slashing damage, you can use your Reaction to reduce it by 1d10 + 5. If that brings the damage to 0, you can spend 1 FP to throw it back: pick a target (within 5 ft melee or 60 ft ranged, not behind full cover). They roll a DEX save or take 2d6 + 1 damage.",
      whenItMatters: "Almost every time you get hit with a physical attack. Your Reaction is rarely being used for anything else, so this is free value. Deflect to 0 + redirect = essentially a counter-attack.",
    },
    "Slow Fall": {
      plain: "Reaction on falling — reduce the damage by 20 HP. Saves your life on any fall under ~20 ft, significantly lessens bigger falls.",
      whenItMatters: "Any time you fall. Always use it — costs nothing.",
    },
    "Intelligent Strikes": {
      plain: "Instead of using Dexterity for your unarmed attacks (normal Monk rule), you can use your INT mod (+2). This is baked into your +2 attack bonus on unarmed strikes.",
      whenItMatters: "Already applied. Just know that when you see 'attack roll' for an unarmed strike, it's d20 + 2.",
    },
    "Open Hand Technique": {
      plain: "When you HIT with a Flurry of Blows attack, you pick one effect: (a) DEX save or knocked Prone, (b) STR save or pushed 15 ft, (c) target can't take Reactions until end of your next turn. You pick per hit — so a Flurry with 2 hits = 2 effects.",
      whenItMatters: "Every Flurry of Blows. PRONE is amazing when allies follow up in melee (they get advantage). SHOVE creates space or terrain advantage. NO REACTIONS lets your team move freely.",
    },
    "Bloodbound Discernment — Ring of Discernment": {
      plain: "Old-world artifact ring. 3 times per day, you can spend 7 HP to activate it: after someone makes a statement, slide the ring. Cold = they lied. Warm = they told the truth.",
      whenItMatters: "High-stakes social moments where getting the answer wrong is dangerous. 7 HP is real — save it for claims that actually matter. Resets on a Long Rest.",
    },
    "Ring of Discernment": {
      plain: "Old-world artifact ring. 3 times per day, spend 7 HP to activate: after someone makes a statement, slide the ring. Cold = lie, warm = truth.",
      whenItMatters: "High-stakes social moments. 7 HP is a big chunk of your 28 — save it for claims that actually matter. Resets on a Long Rest.",
    },
    "Flurry of Blows": {
      plain: "Spend 1 FP as a bonus action to make TWO unarmed strikes (replacing your normal free bonus-action strike). Each hit triggers Open Hand Technique (pick prone, shove, or no-reactions per hit).",
      whenItMatters: "When you want more damage OR you need a control effect. Costs FP — use it on threats that matter, not every round.",
    },
    "Patient Defense": {
      plain: "FREE as a bonus action: you Disengage (move without opportunity attacks). For 1 FP: you also Dodge (attacks against you have disadvantage until your next turn).",
      whenItMatters: "Free version: any time you need to pull back from melee. Paid version: in boss fights when you need to survive a round.",
    },
    "Step of the Wind": {
      plain: "FREE as a bonus action: you Dash (double your movement — 40 → 80 ft this turn). For 1 FP: you also Disengage AND your jump distance is doubled for the turn.",
      whenItMatters: "Covering distance fast. The paid version is for safe retreats or big jumps.",
    },
    "Unarmed Strike": {
      plain: "A punch, kick, elbow, knee, or headbutt. +2 to hit (INT via Intelligent Strikes), 1d6 bludgeoning. After you take the Attack action with one, you get a FREE bonus-action unarmed strike.",
      whenItMatters: "Your default. Every turn.",
    },
    "Velthar Steel Hair Needles": {
      plain: "Your 'real' weapon — looks like hairpins. +4 to hit, 1d8 piercing. Also let you scale walls and climb without rolling Acrobatics.",
      whenItMatters: "When 1d8 > 1d6 matters, vs bludgeoning-resistant enemies, or when vertical mobility is useful.",
    },

    // ---- Core combat math ----
    "AC": {
      plain: "Armor Class — how hard you are to hit. An attacker rolls d20 + bonuses; if it meets or beats your AC, they hit.",
      whenItMatters: "Yours is 13 (10 + DEX +1 + WIS +2). Low for a frontliner — lean on mobility, Deflect Attacks, and Patient Defense instead of standing and eating hits.",
    },
    "HP": {
      plain: "Hit Points — your health pool. At 0 you fall unconscious and start making Death Saving Throws.",
      whenItMatters: "Your max is 28. Below ~10 HP, play defensively: Patient Defense, Step of the Wind out, or Deflect every hit.",
    },
    "Focus Points": {
      plain: "Your Monk 'magic fuel'. Spent on Flurry of Blows (1 FP), paid Patient Defense (1 FP), paid Step of the Wind (1 FP), and redirecting a Deflect Attacks (1 FP).",
      whenItMatters: "You have 4. Restore all of them on a Short Rest (1 hour) or a Long Rest. Uncanny Metabolism can also refill them once per day when you roll Initiative.",
    },
    "Action": {
      plain: "The main thing you do on your turn — one per turn. Attack, Dash, Dodge, Disengage, Help, Hide, Ready, Search, or use a magic item like the Ring.",
      whenItMatters: "Your most valuable slot. Usually: Attack. You can only take ONE action per turn.",
    },
    "Bonus Action": {
      plain: "A smaller extra action — one per turn. Monks use this constantly: Flurry of Blows, Patient Defense, Step of the Wind, or the free bonus-action unarmed strike after the Attack action.",
      whenItMatters: "Don't waste it. As a Monk, nearly every turn should use a bonus action.",
    },
    "Reaction": {
      plain: "A special response to a trigger outside your turn — one per round. Yours: Deflect Attacks, Slow Fall, Opportunity Attack, and Ready-triggered actions.",
      whenItMatters: "Your Reaction is Deflect Attacks nearly every round. Resets at the start of your next turn.",
    },
    "Attack action": {
      plain: "Taking the 'Attack' option as your Action — you make one weapon/unarmed attack (at level 4). Triggers the Monk free bonus-action unarmed strike.",
      whenItMatters: "Almost every combat turn. After your Attack action you still have your Bonus Action and Movement.",
    },
    "Initiative": {
      plain: "A d20 + DEX (+1) roll at the start of combat to decide turn order. Highest goes first.",
      whenItMatters: "Uncanny Metabolism triggers when you roll Initiative — if you're low on FP or HP, burn it here.",
    },

    // ---- Standard actions ----
    "Dash": {
      plain: "Take the Dash action to double your movement this turn (40 → 80 ft). Step of the Wind gives you a second Dash as a bonus action.",
      whenItMatters: "Closing gaps or retreating. Action-Dash + Step-of-the-Wind = 160 ft in one turn.",
    },
    "Disengage": {
      plain: "Move without triggering Opportunity Attacks from enemies in melee range. Patient Defense gives you this FREE as a bonus action.",
      whenItMatters: "Any time you need to pull out of a melee without eating a parting shot.",
    },
    "Dodge": {
      plain: "Take the Dodge action: attackers against you roll with disadvantage, and you have advantage on DEX saves until your next turn.",
      whenItMatters: "You're out of Focus and need to survive a round. Also strong when you're tanking a boss away from an ally.",
    },
    "Help": {
      plain: "Spend your Action to grant an ally advantage on their next attack against a target within 5 ft of you, OR help them with an ability check.",
      whenItMatters: "When your party's heavy hitter needs a boost, or on a clutch skill check.",
    },
    "Hide": {
      plain: "Make a Stealth check (yours is +1) vs enemy Perception. If you beat them, you're hidden — your next attack has advantage.",
      whenItMatters: "Only if you have cover or concealment. You're not a rogue; let the party's stealth specialist lead.",
    },
    "Ready": {
      plain: "Prepare a specific Action to trigger on a condition you name ('when the door opens, I throw a needle'). Uses your Reaction to fire.",
      whenItMatters: "Ambushes, doorways, or when you NEED to go last on purpose. Costs your Reaction for the round.",
    },
    "Search": {
      plain: "Spend your Action to make a Perception or Investigation check to find something specific.",
      whenItMatters: "Traps, hidden doors, lost items — when 'I look around' isn't enough.",
    },
    "Opportunity Attack": {
      plain: "When a creature leaves your reach (5 ft) without Disengaging, you can use your Reaction to make ONE melee attack against them.",
      whenItMatters: "They ran without Disengaging? Punish them. Costs your Reaction, so Deflect Attacks won't be available that round.",
    },

    // ---- Rolls, saves, conditions ----
    "Advantage": {
      plain: "Roll two d20s, keep the HIGHER. Huge swing — roughly +5 to the roll on average.",
      whenItMatters: "You get it from attacking Prone targets in melee, being hidden, or allies using Help.",
    },
    "Disadvantage": {
      plain: "Roll two d20s, keep the LOWER. Roughly -5 on average.",
      whenItMatters: "Attackers have it when you Dodge or use paid Patient Defense. You get it when you're Prone or attacking at long range.",
    },
    "ability check": {
      plain: "d20 + ability modifier (+ proficiency if proficient) vs a DC the DM sets. 'Make a Strength check' = d20 + STR mod.",
      whenItMatters: "Everything non-combat. Your best mods: CHA +3, INT +2, CON +2, WIS +2.",
    },
    "skill check": {
      plain: "An ability check tied to a specific skill (Persuasion, Stealth, etc.). You add your proficiency bonus (+2) if proficient.",
      whenItMatters: "Most out-of-combat rolls. Your top: Persuasion +5, Insight/History-Culture/Blood Magic/Medicine +4.",
    },
    "saving throw": {
      plain: "A defensive d20 roll vs an effect (spell, trap, poison). You add your ability mod + proficiency if the save is in your proficient list.",
      whenItMatters: "You're proficient in STR (+1), DEX (+3), and INT (+4) saves. INT saves are rare but critical (mind magic, illusions).",
    },
    "DEX save": {
      plain: "Dexterity saving throw — d20 + DEX mod + proficiency (if proficient). Yours is +3.",
      whenItMatters: "Dodging AoE effects (fireballs, traps, breath weapons). You're proficient — you're above average at these.",
    },
    "STR save": {
      plain: "Strength saving throw — d20 + STR mod + proficiency. Yours is +1.",
      whenItMatters: "Resisting grapples, shoves, and forced movement. You're proficient but weak at it — expect to fail half the time.",
    },
    "INT save": {
      plain: "Intelligence saving throw — d20 + INT mod + proficiency. Yours is +4.",
      whenItMatters: "Mental effects (illusions, psychic damage, mind control). Rare but brutal when they come up — and you're genuinely good at them.",
    },
    "CON save": {
      plain: "Constitution saving throw — d20 + CON mod. Yours is +2 (not proficient).",
      whenItMatters: "Resisting poison, holding Concentration (you don't cast, so rare). Decent but not specialized.",
    },
    "DC": {
      plain: "Difficulty Class — the target number to beat on a roll. 'DC 15 Persuasion' means roll d20 + 5 and try to hit 15+.",
      whenItMatters: "The DM sets it. Easy = 10, Medium = 15, Hard = 20, Nearly impossible = 25.",
    },
    "Prone": {
      plain: "Condition: you're on the ground. Melee attacks against you have ADVANTAGE; ranged attacks have disadvantage. Your own attacks have disadvantage. Costs half your speed (20 ft) to stand up.",
      whenItMatters: "Open Hand knock-prone is your best control effect when allies are meleeing. Don't get proned yourself near enemy melee.",
    },
    "cover": {
      plain: "Terrain between you and an attacker reduces hits. Half cover: +2 AC and DEX saves. Three-quarters: +5. Total cover: can't be targeted at all.",
      whenItMatters: "Use corners, pillars, allies. Even a +2 AC bump turns a hit into a miss often.",
    },
    "Long Rest": {
      plain: "8 hours of downtime. Fully restores HP, all Focus Points, your Ring of Discernment uses, and Uncanny Metabolism.",
      whenItMatters: "Usually overnight. The DM decides when one is possible — you don't just declare it.",
    },
    "Short Rest": {
      plain: "One hour of light rest. For Monks: restores ALL your Focus Points. Does NOT automatically heal HP (can spend Hit Dice to heal).",
      whenItMatters: "Huge for you. If the DM allows a Short Rest between fights, you refill FP for free — take it.",
    },
    "Martial Arts die": {
      plain: "Your Monk damage die — at level 4 it's a d6. Used for unarmed strike damage and the Deflect Attacks redirect (2 × d6 + DEX mod).",
      whenItMatters: "Any unarmed strike rolls 1d6 damage. Scales up at higher Monk levels.",
    },
  },

  // --------------------------------------------------
  //  GLOSSARY — D&D + Iosandros
  // --------------------------------------------------
  glossary: [
    // Core D&D
    { term: "AC (Armor Class)", domain: "D&D", def: "How hard you are to hit. An attacker rolls d20 + bonuses vs your AC. Yours is 13." },
    { term: "DC (Difficulty Class)", domain: "D&D", def: "The target number you need to roll to succeed at something. 'DC 15 Persuasion' = roll d20 + 5 (yours) vs 15." },
    { term: "Advantage / Disadvantage", domain: "D&D", def: "Advantage: roll two d20s, keep the HIGHER — when you have the upper hand (cover, prone targets, allies, class features). Disadvantage: roll two d20s, keep the LOWER — when you're impaired (prone, frightened, obscured, etc.). If you have both, they cancel and you roll one d20." },

    // Iosandros campaign
    { term: "SE (Standard Era)", domain: "Iosandros", def: "The dating system of the Realm. 0 SE = the Separation, when the Gods stripped magic from the world. Today is 1224 SE." },
    { term: "The Separation", domain: "Iosandros", def: "The event that ended the previous age. Gods stripped the Realm of magic, named the Brolin bloodline to rule until seven prophecies are fulfilled, then wiped their own names and 15,000+ years of history." },
    { term: "Eternium", domain: "Iosandros", def: "The divine authority/seat established at 0 SE, housed within Castle Highrock. The foundation of the High King's rule. Will stand until an Undying King is revealed." },
    { term: "The Seven Prophecies", domain: "Iosandros", def: "The seven signs set at the Separation. When fulfilled (in any order), the Brolin bloodline's divine right to rule ends. See Other Info → The Seven Prophecies for the full text." },
    { term: "The Undying King", domain: "Iosandros", def: "Prophesied figure whose revelation ends the Brolin line. Associated with the seventh prophecy — the sword pulled from the stone." },
    { term: "The High King", domain: "Iosandros", def: "Ruler of Iosandros from the Brolin bloodline, seated in Highrock (capital of Lorenthar). Currently: Trask Brolin, reclusive since 1208." },
    { term: "Blood Magic", domain: "Iosandros", def: "Magic unlocked by blood sacrifice. Outlawed Realm-wide. Unpredictable — different people manifest different abilities. Used by terrorists to destroy cities (Raena 900 SE, Sar'Adahm 850 SE, Solvane 1185 SE). You're proficient in Blood Magic (+4 knowledge check), but that's ACADEMIC knowledge, not casting." },
    { term: "Blood Knights", domain: "Iosandros", def: "Elite division within the Lorenthar Court permitted to use Blood Magic in the King's name. Originally created as a check on royal power. 'If a Blood Knight is around, so are Kings, monsters, or magic.'" },
    { term: "Dead-World artifacts", domain: "Iosandros", def: "Magical items from before the Separation. Illegal to own, trade, or use. Your business, Golden Basin Goods, illegally deals in these — it's the secret of your fortune. Your Ring of Discernment is one." },
    { term: "The 13 Kingdoms", domain: "Iosandros", def: "The sovereign kingdoms of Iosandros: Lorenthar (capital), Veltharion, Nexhollow, Selquinar, Solvarra, Garrondel, Drozvane (exiled), Thirellia, Esmireth, Jaklu, Osmere, Pendant Coast (your base), Candamos." },
    { term: "The Territories", domain: "Iosandros", def: "Unruled regions: Norvale Plains (Free People), Mour Marsh (Brolin officially), Frozen North." },
    { term: "Way of the Intelligent Hand", domain: "Iosandros/D&D", def: "Your Monk subclass. Monks who study anatomy and acupuncture to strike the body's weakest points — incapacitating with the least effort. Gives you Intelligent Strikes (INT on attacks) and Open Hand Technique." },
    { term: "Golden Basin Goods", domain: "Iosandros", def: "Your and Jeffrey's company. Publicly: shipping, freight, trade. Privately: Dead-World artifact trade. Jeff runs operations; you run strategy, finance, and negotiation." },
    { term: "Rewarded (background)", domain: "Iosandros", def: "Your D&D background. You're wealthy and well-connected through merit and hustle. Benefits: INT save proficiency, Medicine proficiency, writs of value (personal checks backed by your company), access to shipping, and advantage on History/Culture checks in six Kingdoms of your choice." },
    { term: "The Pendant Coast", domain: "Iosandros", def: "Your base of operations. Small, extraordinarily wealthy, gaudy and ostentatious. Ruled by four minor houses in Court. Capital: Golden Tide." },
    { term: "Splint-Water", domain: "Iosandros", def: "Your birthplace, in Osmere. You left and built your life on the Pendant Coast." },
  ]
};
