/** The Cherrytree lockup: the cherries and the wordmark in Instrument Serif. */
function BrandMark({ small = false }: { small?: boolean }) {
  const size = small ? 20 : 22;
  return (
    <span className={`inline-flex items-center ${small ? 'gap-2' : 'gap-2.25'}`}>
      <img
        src="/images/cherries.png"
        alt=""
        width={size}
        height={size}
        className="object-contain"
      />
      <span className={`font-serif leading-none text-ink ${small ? 'text-base' : 'text-[17px]'}`}>
        Cherrytree
      </span>
    </span>
  );
}

export default BrandMark;
