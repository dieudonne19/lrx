import { EmptyState, LrxMark, ProjectCover, Screen, ScreenBody } from '@/components/lrx';
import { Fade } from '@/components/lrx/fade';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PRIMARY, primaryAlpha } from '@/lib/brand';
import type { Project, ProjectFilter } from '@/lib/lrx-ui-types';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { ChevronRight, MoreHorizontal, Plus, Rows3, Search, Settings } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

export function HomeScreen({
  projects,
  onOpen,
  onImportLyrics,
  onImportAudio,
  onOpenSettings,
  onMore,
}: {
  projects: Project[];
  onOpen: (project: Project) => void;
  onImportLyrics: () => void;
  onImportAudio: () => void;
  onOpenSettings: () => void;
  onMore: (project: Project) => void;
}) {
  const [filter, setFilter] = React.useState<ProjectFilter>('all');
  const filteredProjects = React.useMemo(
    () => projects.filter((project) => filter === 'all' || project.status === filter),
    [filter, projects]
  );
  const inProgress = projects.find((project) => project.status === 'in-progress');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <ScreenBody>
          <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
            <View className="flex-row items-center gap-3">
              <LrxMark />
              <Text className="text-lg font-semibold text-foreground">LRX</Text>
            </View>
            <View className="flex-row gap-1">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Icon as={Search} className="size-5 text-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onPress={onOpenSettings} className="rounded-full">
                <Icon as={Settings} className="size-5 text-foreground" />
              </Button>
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="pb-28" showsVerticalScrollIndicator={false}>
            {projects.length === 0 ? (
              <EmptyState
                illustration="projects"
                title="Aucun projet"
                body="Importe un fichier audio pour commencer ta première synchronisation."
                cta="Nouveau projet"
                onCta={onImportAudio}
              />
            ) : (
              <>
                <View className="px-5 pb-[18px] pt-3.5">
                  <Text className="text-2xl font-semibold leading-7 tracking-[-0.48px] text-foreground">Tes projets</Text>
                  <Text className="mt-1 text-xs leading-4 text-muted-foreground">
                    Reprends une session ou commence une nouvelle synchro.
                  </Text>
                </View>

                {inProgress ? <ResumeProject project={inProgress} onOpen={onOpen} /> : null}

                <FilterTabs projects={projects} filter={filter} onChange={setFilter} />

                <View className="pt-1">
                  {filteredProjects.length ? (
                    filteredProjects.map((project, index) => (
                      <ProjectRow key={project.id} project={project} index={index} onOpen={onOpen} onMore={onMore} />
                    ))
                  ) : (
                    <EmptyState
                      illustration="projects"
                      title="Aucun projet ici"
                      body="Change de filtre ou démarre une nouvelle session LRC avec un audio ou des paroles."
                      cta="Nouveau projet"
                      onCta={onImportAudio}
                      secondaryCta="Coller des paroles"
                      onSecondaryCta={onImportLyrics}
                      className="mx-4 rounded-3xl border border-border bg-card/45"
                    />
                  )}
                </View>

                <Text className="mt-7 text-center font-mono text-[11px] text-muted-foreground">
                  {projects.length} projets - {projects.reduce((sum, project) => sum + project.total, 0)} lignes au total
                </Text>
              </>
            )}
          </ScrollView>

          <Fade direction="up" className="absolute bottom-0 left-0 right-0 h-[110px]" />
          <View className="absolute bottom-[18px] left-4 right-4 flex-row gap-2.5">
            <Button variant="outline" size="lg" onPress={onImportLyrics} className="h-14 flex-1 rounded-2xl border-border bg-background">
              <Icon as={Rows3} className="size-[18px] text-foreground" />
              <Text>Coller des paroles</Text>
            </Button>
            <Button
              size="lg"
              onPress={onImportAudio}
              style={{ shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
              className="h-14 flex-[1.4] rounded-2xl">
              <Icon as={Plus} className="size-[18px] text-primary-foreground" />
              <Text>Nouveau projet</Text>
            </Button>
          </View>
        </ScreenBody>
      </Screen>
    </>
  );
}

function ResumeProject({ project, onOpen }: { project: Project; onOpen: (project: Project) => void }) {
  const progress = Math.round((project.synced / Math.max(1, project.total)) * 100);

  return (
    <View className="px-4 pb-4">
      <Pressable
        onPress={() => onOpen(project)}
        className="flex-row items-center gap-3.5 overflow-hidden rounded-2xl border border-primary/15 p-4">
        <LinearGradient
          colors={[primaryAlpha(0.18), primaryAlpha(0.04)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <ProjectCover colors={project.cover} size={56} index={0} />
        <View className="min-w-0 flex-1">
          <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1.3px] text-primary-hi">
            ▸ Reprendre la session
          </Text>
          <Text numberOfLines={1} className="text-base font-semibold text-foreground">
            {project.title}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {project.synced}/{project.total} lignes - {project.updated}
          </Text>
          <View className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-secondary">
            <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </View>
        </View>
        <Icon as={ChevronRight} className="size-5 text-muted-foreground" />
      </Pressable>
    </View>
  );
}

function FilterTabs({
  projects,
  filter,
  onChange,
}: {
  projects: Project[];
  filter: ProjectFilter;
  onChange: (filter: ProjectFilter) => void;
}) {
  const tabs: { id: ProjectFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tous', count: projects.length },
    { id: 'in-progress', label: 'En cours', count: projects.filter((project) => project.status === 'in-progress').length },
    { id: 'done', label: 'Finalises', count: projects.filter((project) => project.status === 'done').length },
    { id: 'draft', label: 'Brouillons', count: projects.filter((project) => project.status === 'draft').length },
  ];

  return (
    <ScrollView
      horizontal
      className="pb-3"
      contentContainerClassName="gap-2 px-4"
      showsHorizontalScrollIndicator={false}>
      {tabs.map((tab) => {
        const selected = filter === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-[7px] ${
              selected ? 'bg-foreground' : 'bg-card'
            }`}>
            <Text className={`text-xs font-medium ${selected ? 'text-background' : 'text-secondary-foreground'}`}>
              {tab.label}
            </Text>
            <Text className={`text-[11px] ${selected ? 'text-background/60' : 'text-muted-foreground'}`}>
              {tab.count}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ProjectRow({
  project,
  index,
  onOpen,
  onMore,
}: {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
  onMore: (project: Project) => void;
}) {
  const percent = Math.round((project.synced / Math.max(1, project.total)) * 100);
  const statusText = project.status === 'done' ? 'FAIT' : project.status === 'draft' ? 'DRAFT' : `${percent}%`;
  const statusClass =
    project.status === 'done'
      ? 'text-chart-2'
      : project.status === 'draft'
        ? 'text-subtle'
        : 'font-mono font-medium text-muted-foreground';

  return (
    <Pressable
      onPress={() => onOpen(project)}
      onLongPress={() => onMore(project)}
      className="flex-row items-center gap-3 py-2 pl-5 pr-2">
      <ProjectCover colors={project.cover} size={48} index={index} status={project.status} />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-[15px] font-medium text-foreground">
          {project.title}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Text numberOfLines={1} className="max-w-[128px] text-xs text-muted-foreground">
            {project.artist}
          </Text>
          <Text className="text-xs text-subtle">-</Text>
          <Text className="font-mono text-xs text-muted-foreground">{project.duration}</Text>
        </View>
      </View>
      <View className="items-end">
        <Text className={`text-[11px] font-semibold tracking-[0.44px] ${statusClass}`}>{statusText}</Text>
        <Text className="mt-0.5 text-[10.5px] text-subtle">{project.updated}</Text>
      </View>
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={`Actions pour ${project.title}`}
        onPress={() => onMore(project)}
        className="size-12 rounded-full">
        <Icon as={MoreHorizontal} className="size-5 text-muted-foreground" />
      </Button>
    </Pressable>
  );
}
