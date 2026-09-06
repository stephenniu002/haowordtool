export function improveArticles(articles) {
  const revisions={
    'wildcard-blank-tile-strategy': {
      title:'How to Use Blank Tiles in a Word Unscrambler',
      dek:'Work through CART? and LET?, identify the letters supplied by blanks, calculate their scores, and check your answers with three exercises.',
      example:'letters=CART%3F&exact=1',
      sections:[
        ['Keep the blank flexible','A blank supplies one missing letter. In a rack search, its position is not fixed: CART? can be rearranged, and the blank can represent a different letter for each candidate. Choosing E before searching would exclude words needing O, K, S or F. Keep the blank unassigned until a clue or board constraint narrows your options.'],
        ['Count through CART?','For CRATE, cross off C, R, A and T from the rack; the blank supplies E. For ACTOR, it supplies O. For TRACK, it supplies K. For CARTS, it supplies S. Each candidate uses all five tiles. CAR uses only C, A and R, so it fits subset mode but fails exact mode. These are letter-inventory checks; acceptance in a particular game is a separate dictionary check.'],
        ['Repeated letters still need separate tiles','LET? can make TELL: the printed tiles supply T, E and one L; the blank supplies the second L. LET alone cannot make TELL. Cross out one available tile for every letter in a candidate. If none remains, spend a blank. If neither a matching tile nor a blank remains, reject the candidate. In exact mode, every rack tile must also be used.'],
        ['Score the tiles you actually have','Using English Scrabble-style values, CRATE from CART? has base value C(3) + R(1) + A(1) + T(1) + blank E(0) = 6. The same spelling made from five printed tiles totals 7. Our result highlights blank-supplied letters and counts them as zero. This is not a complete move score: board multipliers, crossing words and applicable bonuses require your actual board and game rules.'],
        ['Choose length and mode deliberately','Use exact mode when every supplied tile must be used. Use subset mode when shorter words are acceptable. With seven tiles and space for five letters, choose a five-letter range in subset mode. Exact mode would instead require seven letters. When there are no results, check the settings and repeated letters before assuming no word exists; a dictionary can also omit a legitimate word.'],
        ['Do not confuse racks with position patterns','CART? is an unordered rack. A pattern such as C?A?E may instead describe known first, third and fifth letters. CRATE fits those fixed positions; REACT does not. This solver rearranges letters and has no fixed-position mode. For a crossword, use an explicit pattern tool, then verify the clue meaning.'],
        ['Practice before reading the answers','Question 1: Can LET? make TELL using every tile, and which letter is blank? Question 2: Can CART? make CAR in exact mode? Question 3: What is CAT’s base value from CA?, with C=3 and A=1? Write down your reasoning before checking.'],
        ['Answers and what they teach','Answer 1: Yes; the second L is blank. Answer 2: No, because two tiles remain; CAR works in subset mode. Answer 3: Four points, because the blank T contributes zero. Use the linked example to repeat the method with CART?, then try LET? yourself. For unfamiliar results, check a definition and your required game dictionary.']
      ]
    },
    'anagram-solver-vs-word-finder': {
      title:'Exact Anagram or Subset Search? Choose with Worked Examples',
      dek:'Compare LISTEN, LIST and repeated-letter racks to choose the right search mode, understand length filters, and avoid positional-pattern mistakes.',
      example:'letters=LISTEN&exact=1',
      sections:[
        ['Start with the requirement, not the tool name','Before searching, ask whether every tile must be used. An exact anagram rearranges the entire rack without adding or dropping a letter. A subset search permits unused tiles. Both modes must respect repeated letters. The distinction matters more than the name of a tool: websites sometimes use anagram solver, unscrambler and word finder interchangeably.'],
        ['Work through LISTEN','LISTEN has six different letters. SILENT, ENLIST and TINSEL use all six, so each passes exact mode. LIST uses L, I, S and T but leaves E and N unused, so it passes subset mode only. Enter LISTEN with exact mode enabled, then turn exact mode off and set minimum and maximum length to four. The second search asks a different, narrower question about word length.'],
        ['Length alone is not enough','A six-letter candidate is not automatically an anagram of LISTEN. LETTER has the right length but needs two Es, two Ts and an R. Those tiles are unavailable. Matching therefore requires both a compatible length and a count for every letter. This also explains why seeing a letter somewhere in the rack does not authorize using it twice.'],
        ['Check a repeated-letter rack','LEVEL contains two Ls, two Es and one V. It can form LEVEL in exact mode and EEL in subset mode. EVE cannot be made from LEV because it needs a second E. LEV? can form EVE in subset mode by spending its blank on E, but fails exact mode because the L remains unused. Counting the leftover tiles is an easy final check.'],
        ['Use exact length inside subset mode','Suppose a seven-tile rack must fit five open squares. Choose subset mode with both length limits set to five. Exact mode means using all seven tiles, not merely finding words of a chosen length. In this tool, selecting exact mode disables the range controls and uses the rack length so those requirements cannot contradict each other.'],
        ['Known positions are a separate constraint','A crossword pattern C?A?E fixes three letter positions. CRATE fits; REACT does not, even though both use the same printed letters. This rack solver cannot preserve positions. Use a position-aware tool for that task, then compare definitions with the clue. Adding a blank does not turn an unordered search into a crossword solver.'],
        ['Two checks to try','Can LISTEN make LIST in exact mode? No: two letters remain. Can LEV? make EVE using every tile? No: the blank provides the second E, but L remains. Both become possible in subset mode. Explain both the letter supply and any leftover tiles before accepting an answer.'],
        ['Verify meaning after matching','A matching result establishes that the tiles fit the word list used here. It does not establish current tournament eligibility, suitability for a classroom assignment, or a clue definition. Look up unfamiliar meanings, check the rules for your activity, and keep a record of useful patterns you can recognize without the solver next time.']
      ]
    }
  };
  for(const article of articles) if(revisions[article.slug]) Object.assign(article,revisions[article.slug],{modified:'2026-09-06',read:'4 min'});
}
