import { EmptyState, LrxMark, ProjectCover, Screen, ScreenBody } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Project, ProjectFilter } from '@/lib/lrx-ui-types';
import { Stack } from 'expo-router';
import { ChevronRight, FileText, FolderOpen, MoreHorizontal, Music2, Search, Settings, Upload } from 'lucide-react-native';
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
            <View className="px-5 pb-5 pt-2">
              <Text className="text-[34px] font-semibold leading-10 text-foreground">Tes projets</Text>
              <Text className="mt-2 text-sm leading-5 text-muted-foreground">
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
                  icon={FolderOpen}
                  title="Aucun projet ici"
                  body="Change de filtre ou demarre une nouvelle session LRC avec un audio ou des lyrics."
                  cta="Import audio"
                  onCta={onImportAudio}
                  secondaryCta="Coller lyrics"
                  onSecondaryCta={onImportLyrics}
                  className="mx-4 rounded-3xl border border-border bg-card/45"
                />
              )}
            </View>

            <Text className="mt-7 text-center font-mono text-[11px] text-muted-foreground">
              {projects.length} projets - {projects.reduce((sum, project) => sum + project.total, 0)} lignes au total
            </Text>
          </ScrollView>

          <View className="absolute bottom-5 left-4 right-4 flex-row gap-3">
            <Button variant="outline" size="lg" onPress={onImportLyrics} className="h-14 flex-1 rounded-2xl bg-background/95">
              <Icon as={FileText} className="size-5 text-foreground" />
              <Text>Coller</Text>
            </Button>
            <Button size="lg" onPress={onImportAudio} className="h-14 flex-[1.35] rounded-2xl">
              <Icon as={Upload} className="size-5 text-primary-foreground" />
              <Text>Import audio</Text>
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
    <View className="px-4 pb-5">
      <Pressable onPress={() => onOpen(project)} className="flex-row items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <ProjectCover colors={project.cover} size={58} index={0} />
        <View className="min-w-0 flex-1">
          <View className="mb-1 flex-row items-center gap-1.5">
            <Icon as={Music2} className="size-3.5 text-primary" />
            <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-primary">
              Reprendre la session
            </Text>
          </View>
          <Text numberOfLines={1} className="text-base font-semibold text-foreground">
            {project.title}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground">
            {project.synced}/{project.total} lignes - {project.updated}
          </Text>
          <View className="mt-3 h-1 overflow-hidden rounded-full bg-input">
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
            className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${
              selected ? 'bg-foreground' : 'bg-card'
            }`}>
            <Text className={`text-xs font-medium ${selected ? 'text-background' : 'text-foreground'}`}>
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
    project.status === 'done' ? 'text-chart-2' : project.status === 'draft' ? 'text-muted-foreground' : 'text-foreground';

  return (
    <Pressable
      onPress={() => onOpen(project)}
      onLongPress={() => onMore(project)}
      className="flex-row items-center gap-3 py-2 pl-5 pr-2">
      <ProjectCover colors={project.cover} size={50} index={index} status={project.status} />
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
        <Text className={`text-[11px] font-semibold tracking-[1px] ${statusClass}`}>{statusText}</Text>
        <Text className="mt-1 text-[10px] text-subtle">{project.updated}</Text>
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
