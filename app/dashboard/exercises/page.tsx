import { ExerciseLibrary } from "@/components/exercises/exercise-library"

export default function ExercisesPage() {
    return (
        <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <ExerciseLibrary />
            </div>
        </div>
    )
}
