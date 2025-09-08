% data_processing/rules.pl

% Helper rule to check for category membership in a list.
% Succeeds if Category is a member of the Categories list.
has_category(Categories, Category) :-
    member(Category, Categories).

% Rule to find all traits and their p-values for a given SNP.
% find_traits_for_snp(+SNP, -Trait, -PValue).
find_traits_for_snp(SNP, Trait, PValue) :-
    association(_, SNP, _, Trait, PValue).

% Rule to find all SNPs associated with a specific trait.
% find_snps_for_trait(+Trait, -SNP, -PValue).
find_snps_for_trait(Trait, SNP, PValue) :-
    association(_, SNP, _, Trait, PValue).

% Rule to find SNPs for a trait that also belongs to a given category.
% find_snps_for_trait_in_category(+Trait, +Category, -SNP, -PValue).
find_snps_for_trait_in_category(Trait, Category, SNP, PValue) :-
    association(_, SNP, Categories, Trait, PValue),
    has_category(Categories, Category).

% Rule to check if an association is statistically significant (example threshold).
% A lower p_value_log indicates higher significance.
is_significant(PValueLog, Threshold) :-
    number(PValueLog), 
    PValueLog < Threshold.