import React from 'react'

const SkillsSection = ({ firstName, profile, fmtDate }) => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
        Skills of {firstName}
      </h2>
      <div className="relative group">
        {/* Background glow effect - reduced */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl sm:rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
        
        {/* Main card */}
        <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-primary/20 shadow-lg group-hover:shadow-[0_10px_30px_rgba(124,58,237,0.15)] transition-all duration-300">
          <div className="space-y-4 sm:space-y-6">
            {/* Concentration */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
              <p className="text-base sm:text-lg font-semibold text-foreground">
                Concentration: <span className="text-primary font-bold">{profile.concentration}</span>
              </p>
            </div>
            
            {/* Top Skills */}
            <div>
              <p className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Top Skills:</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {profile.topSkills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 border border-primary/30 rounded-full text-xs sm:text-sm font-medium text-primary backdrop-blur-sm hover:bg-primary/20 transition-colors duration-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Goal Progress */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-primary/20">
              <p className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
                Goal Progress toward {profile.concentration}:
              </p>
              <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                <div className="flex-1 bg-background/50 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${profile.goalProgressPct}%` }}
                  ></div>
                </div>
                <span className="text-lg sm:text-2xl font-bold text-primary">{profile.goalProgressPct}%</span>
              </div>
              <p className="text-xs sm:text-sm text-foreground/70">
                Estimated completion: <span className="font-medium text-foreground">{fmtDate(profile.goalEta)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkillsSection
