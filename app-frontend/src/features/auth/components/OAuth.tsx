export default function OAuth(){
    return (
		<>
			<div className="grid grid-cols-2 gap-2">
				<button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium transition hover:border-primary/40">
					<span className="font-display font-bold text-primary">42</span> School
				</button>
				<button type="button" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/70 text-sm font-medium transition hover:border-primary/40">
					<span className="font-display font-bold text-[#EA4335]">G</span> Google
				</button>
			</div>
		</>
    );
}
